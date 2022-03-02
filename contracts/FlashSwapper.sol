// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "./interfaces/UniswapV2Interfaces.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import './libraries/Decimal.sol';
import "hardhat/console.sol";
import "./interfaces/UniswapV2Interfaces.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

abstract contract FlashSwapper is Ownable {
    using SafeERC20 for IERC20;
    using Decimal for Decimal.D256;
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    enum SwapType {SimpleLoan, SimpleSwap, TriangularSwap}

    struct CallbackData {
        address debtPool;
        address targetPool;
        bool debtTokenSmaller;
        address borrowedToken;
        address debtToken;
        uint256 debtAmount;
        uint256 debtTokenOutAmount;
    }

    struct OrderedReserves {
        uint256 a1; // base asset
        uint256 b1;
        uint256 a2;
        uint256 b2;
    }

    struct ArbitrageInfo {
        address baseToken;
        address quoteToken;
        bool baseTokenSmaller;
        address lowerPool; // pool with lower price, denominated in quote asset
        address higherPool; // pool with higher price, denominated in quote asset
    }

    // CONSTANTS
    address constant ETH = address(0);
    address constant WETH = 0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83;

    IUniswapV2Factory constant uniswapV2Factory = IUniswapV2Factory(0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3);

    // ACCESS CONTROL
    // Only the `permissionedPairAddress` may call the `uniswapV2Call` function
    address permissionedPairAddress = address(1);

    // @notice Flash-borrows _amount of _tokenBorrow from a Uniswap V2 pair and repays using _tokenPay
    // @param _tokenBorrow The address of the token you want to flash-borrow, use 0x0 for ETH
    // @param _amount The amount of _tokenBorrow you will borrow
    // @param _tokenPay The address of the token you want to use to payback the flash-borrow, use 0x0 for ETH
    // @param _userData Data that will be passed to the `execute` function for the user
    // @dev Depending on your use case, you may want to add access controls to this function
    function startSwap(address _tokenBorrow, address _tokenPay, uint256 _amount0Out, uint256 _amount1Out, bytes memory _userData) internal {
        address tokenBorrow = _tokenBorrow;
        address tokenPay = _tokenPay;

        if (tokenBorrow == tokenPay || tokenBorrow == WETH || tokenPay == WETH) {
            simpleFlashLoan(_amount0Out, _amount1Out, _userData);
            return;
        } else {
            traingularFlashSwap(_userData);
            return;
        }

    }


    // @notice Function is called by the Uniswap V2 pair's `swap` function
    function uniswapV2Call(address _sender, uint _amount0, uint _amount1, bytes memory _data) public {
        // access control
        require(msg.sender == permissionedPairAddress, "only permissioned UniswapV2 pair can call");
        require(_sender == address(this), "only this contract may initiate");

        // decode data
        (
            SwapType _swapType,
            bytes memory _triangleData,
            bytes memory _userData
        ) = abi.decode(_data, (SwapType, bytes, bytes));

        if (_swapType == SwapType.SimpleLoan || _swapType == SwapType.SimpleSwap) {
            simpleFlashLoanExecute(_amount0, _amount1, msg.sender, _userData);
            return;
        }else {
            traingularFlashSwapExecute(_triangleData, _userData);
        }

        // NOOP to silence compiler "unused parameter" warning
        if (false) {
            _amount0;
            _amount1;
        }
    }

    // @notice This function is used when the user repays with the same token they borrowed
    // @dev This initiates the flash borrow. See `simpleFlashLoanExecute` for the code that executes after the borrow.
    function simpleFlashLoan(uint256 amount0Out, uint amount1Out, bytes memory _userData) private {

        CallbackData memory info = abi.decode(_userData, (CallbackData));

        bytes memory data = abi.encode(
            SwapType.SimpleLoan,
            bytes(""),
            info
        );

        permissionedPairAddress = info.debtPool; // is it cheaper to compute this locally?
        address pairAddress = permissionedPairAddress; // gas efficiency
        require(pairAddress != address(0), "Requested _token is not available.");
        
        IUniswapV2Pair(pairAddress).swap(amount0Out, amount1Out, address(this), data);
    }

    // @notice This is the code that is executed after `simpleFlashLoan` initiated the flash-borrow
    // @dev When this code executes, this contract will hold the flash-borrowed _amount of _tokenBorrow
    function simpleFlashLoanExecute(
        uint amount0,
        uint amount1,
        address _pairAddress,
        bytes memory _userData
    ) private {

        CallbackData memory info = abi.decode(_userData, (CallbackData));

        uint256 borrowedAmount = amount0 > 0 ? amount0 : amount1;
        IERC20(info.borrowedToken).safeTransfer(info.targetPool, borrowedAmount);

        // uint fee = ((borrowedAmount * 3) / 997) + 1;
        // uint amountToRepay = borrowedAmount + fee;

        (uint256 amount0Out, uint256 amount1Out) =
            info.debtTokenSmaller ? (info.debtTokenOutAmount, uint256(0)) : (uint256(0), info.debtTokenOutAmount);
        
        IUniswapV2Pair(info.targetPool).swap(amount0Out, amount1Out, address(this), new bytes(0));

        IERC20(info.debtToken).safeTransfer(info.debtPool, info.debtAmount);
    }

    // @notice This function is used when neither the _tokenBorrow nor the _tokenPay is WETH
    // @dev Since it is unlikely that the _tokenBorrow/_tokenPay pair has more liquidaity than the _tokenBorrow/WETH and
    //     _tokenPay/WETH pairs, we do a triangular swap here. That is, we flash borrow WETH from the _tokenPay/WETH pair,
    //     Then we swap that borrowed WETH for the desired _tokenBorrow via the _tokenBorrow/WETH pair. And finally,
    //     we pay back the original flash-borrow using _tokenPay.
    // @dev This initiates the flash borrow. See `traingularFlashSwapExecute` for the code that executes after the borrow.
    function traingularFlashSwap(bytes memory _userData) private {

        CallbackData memory info = abi.decode(_userData, (CallbackData));

        uint _amount = info.debtAmount;

        address borrowPairAddress = uniswapV2Factory.getPair(info.borrowedToken, WETH); // is it cheaper to compute this locally?
        require(borrowPairAddress != address(0), "Requested borrow token is not available.");

        permissionedPairAddress = uniswapV2Factory.getPair(info.debtToken, WETH); // is it cheaper to compute this locally?
        address payPairAddress = permissionedPairAddress; // gas efficiency
        require(payPairAddress != address(0), "Requested pay token is not available.");

        // STEP 1: Compute how much WETH will be needed to get _amount of _tokenBorrow out of the _tokenBorrow/WETH pool
        uint pairBalanceTokenBorrowBefore = IERC20(info.borrowedToken).balanceOf(borrowPairAddress);
        require(pairBalanceTokenBorrowBefore >= _amount, "_amount is too big");
        uint pairBalanceTokenBorrowAfter = pairBalanceTokenBorrowBefore - _amount;
        uint pairBalanceWeth = IERC20(WETH).balanceOf(borrowPairAddress);
        uint amountOfWeth = ((1000 * pairBalanceWeth * _amount) / (997 * pairBalanceTokenBorrowAfter)) + 1;

        // using a helper function here to avoid "stack too deep" :(
        traingularFlashSwapHelper(borrowPairAddress, payPairAddress, amountOfWeth, _userData);
    }

    // @notice Helper function for `traingularFlashSwap` to avoid `stack too deep` errors
    function traingularFlashSwapHelper(
        address _borrowPairAddress,
        address _payPairAddress,
        uint _amountOfWeth,
        bytes memory _userData
    ) private {
        // Step 2: Flash-borrow _amountOfWeth WETH from the _tokenPay/WETH pool
        // CallbackData memory info = abi.decode(_userData, (CallbackData));

        address token0 = IUniswapV2Pair(_payPairAddress).token0();
        address token1 = IUniswapV2Pair(_payPairAddress).token1();
        uint amount0Out = WETH == token0 ? _amountOfWeth : 0;
        uint amount1Out = WETH == token1 ? _amountOfWeth : 0;
        bytes memory triangleData = abi.encode(_borrowPairAddress, _amountOfWeth);
        bytes memory data = abi.encode(SwapType.TriangularSwap, triangleData, _userData);
        // initiate the flash swap from UniswapV2
        IUniswapV2Pair(_payPairAddress).swap(amount0Out, amount1Out, address(this), data);
    }

    // @notice This is the code that is executed after `traingularFlashSwap` initiated the flash-borrow
    // @dev When this code executes, this contract will hold the amount of WETH we need in order to get _amount
    //     _tokenBorrow from the _tokenBorrow/WETH pair.
    function traingularFlashSwapExecute(       
        bytes memory _triangleData,
        bytes memory _userData
    ) private {
        // decode _triangleData
        (address _borrowPairAddress, uint _amountOfWeth) = abi.decode(_triangleData, (address, uint));

        CallbackData memory info = abi.decode(_userData, (CallbackData));

        // Step 3: Using a normal swap, trade that WETH for _tokenBorrow
        address token0 = IUniswapV2Pair(_borrowPairAddress).token0();
        address token1 = IUniswapV2Pair(_borrowPairAddress).token1();
        uint amount0Out = info.borrowedToken == token0 ? info.debtAmount : 0;
        uint amount1Out = info.borrowedToken == token1 ? info.debtAmount : 0;
        IERC20(WETH).transfer(_borrowPairAddress, _amountOfWeth); // send our flash-borrowed WETH to the pair
        IUniswapV2Pair(_borrowPairAddress).swap(amount0Out, amount1Out, address(this), bytes(""));

        // compute the amount of _tokenPay that needs to be repaid
        address payPairAddress = permissionedPairAddress; // gas efficiency
        uint pairBalanceWETH = IERC20(WETH).balanceOf(payPairAddress);
        uint pairBalanceTokenPay = IERC20(info.debtToken).balanceOf(payPairAddress);
        uint amountToRepay = ((1000 * pairBalanceTokenPay * _amountOfWeth) / (997 * pairBalanceWETH)) + 1;

        // Step 4: Do whatever the user wants (arb, liqudiation, etc)
        // execute(_tokenBorrow, _amount, _tokenPay, amountToRepay, _userData);

        // (uint256 amount0Out, uint256 amount1Out) =
        //     info.debtTokenSmaller ? (info.debtTokenOutAmount, uint256(0)) : (uint256(0), info.debtTokenOutAmount);
        // IUniswapV2Pair(_payPairAddress).swap(amount0Out, amount1Out, address(this), new bytes(0));

        // Step 5: Pay back the flash-borrow to the _tokenPay/WETH pool
        IERC20(info.debtToken).transfer(payPairAddress, amountToRepay);
    }

    // @notice This is where the user's custom logic goes
    // @dev When this function executes, this contract will hold _amount of _tokenBorrow
    // @dev It is important that, by the end of the execution of this function, this contract holds the necessary
    //     amount of the original _tokenPay needed to pay back the flash-loan.
    // @dev Paying back the flash-loan happens automatically by the calling function -- do not pay back the loan in this function
    // @dev If you entered `0x0` for _tokenPay when you called `flashSwap`, then make sure this contract holds _amount ETH before this
    //     finishes executing
    // @dev User will override this function on the inheriting contract
    function execute(address _tokenBorrow, uint _amount, address _tokenPay, uint _amountToRepay, bytes memory _userData) virtual internal;

   receive() external payable {}

    /// @dev Redirect uniswap callback function
    /// The callback function on different DEX are not same, so use a fallback to redirect to uniswapV2Call
    fallback(bytes calldata _input) external returns (bytes memory) {
        (address sender, uint256 amount0, uint256 amount1, bytes memory data) = abi.decode(_input[4:], (address, uint256, uint256, bytes));
        uniswapV2Call(sender, amount0, amount1, data);
    }

}