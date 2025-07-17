// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.4;

// https://github.com/buttonwood-protocol/button-wrappers/blob/main/contracts/interfaces/IButtonWrapper.sol
interface IButtonWrapper {
    /// @return The address of the underlying token.
    function underlying() external view returns (address);

    /// @param uAmount The amount of underlying tokens.
    /// @return The amount of wrapper tokens exchangeable.
    function underlyingToWrapper(uint256 uAmount) external view returns (uint256);

    /// @param amount The amount of wrapper tokens.
    /// @return The amount of underlying tokens exchangeable.
    function wrapperToUnderlying(uint256 amount) external view returns (uint256);

    /// @notice Burns wrapper tokens from {msg.sender} and transfers
    ///         the underlying tokens to the specified beneficiary.
    /// @param to The beneficiary account.
    /// @param amount The amount of wrapper tokens to burn.
    /// @return The amount of underlying tokens withdrawn.
    function burnTo(address to, uint256 amount) external returns (uint256);

    /// @notice Transfers underlying tokens from {msg.sender} to the contract and
    ///         mints wrapper tokens to the specified beneficiary.
    /// @param to The beneficiary account.
    /// @param uAmount The amount of underlying tokens to deposit.
    /// @return The amount of wrapper tokens mint.
    function depositFor(address to, uint256 uAmount) external returns (uint256);
}
