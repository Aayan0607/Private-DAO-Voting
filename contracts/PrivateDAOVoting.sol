// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

/// @notice Advisory Yes/No voting with fixed membership and Semaphore proofs.
contract PrivateDAOVoting {
    uint256 constant FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant TREE_DEPTH = 6;
    address public immutable administrator;
    ISemaphoreVerifier public immutable verifier;
    uint256 public proposalCount;
    struct Proposal { string title; uint256 root; uint64 opensAt; uint64 closesAt; uint256 yes; uint256 no; }
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(uint256 => bool)) public usedNullifiers;
    error Unauthorized(); error InvalidProposal(); error VotingClosed(); error InvalidChoice();
    error AlreadyVoted(); error InvalidProof();
    event ProposalCreated(uint256 indexed id, string title, uint256 root, uint64 opensAt, uint64 closesAt);
    event VoteAccepted(uint256 indexed id, uint256 nullifier, uint8 choice);
    constructor(address verifierAddress) {
        require(verifierAddress.code.length > 0, "Verifier required");
        administrator = msg.sender;
        verifier = ISemaphoreVerifier(verifierAddress);
    }
    function createProposal(string calldata title, uint256 root, uint64 opensAt, uint64 closesAt) external returns (uint256 id) {
        if(msg.sender != administrator) revert Unauthorized();
        if(bytes(title).length == 0 || bytes(title).length > 200 || root == 0 || root >= FIELD ||
            closesAt <= opensAt || closesAt <= block.timestamp) revert InvalidProposal();
        id = ++proposalCount;
        proposals[id] = Proposal(title,root,opensAt,closesAt,0,0);
        emit ProposalCreated(id,title,root,opensAt,closesAt);
    }
    function scopeForProposal(uint256 id) public view returns(uint256) {
        return uint256(keccak256(abi.encode("PRIVATE_DAO_VOTING_V1",block.chainid,address(this),id))) >> 8;
    }
    function vote(uint256 id, uint8 choice, uint256 nullifier, uint256[8] calldata points) external {
        Proposal storage proposal = proposals[id];
        if(id == 0 || id > proposalCount) revert InvalidProposal();
        if(block.timestamp < proposal.opensAt || block.timestamp >= proposal.closesAt) revert VotingClosed();
        if(choice != 1 && choice != 2) revert InvalidChoice();
        if(nullifier >= FIELD) revert InvalidProof();
        if(usedNullifiers[id][nullifier]) revert AlreadyVoted();
        bool valid = verifier.verifyProof(
            [points[0],points[1]], [[points[2],points[3]],[points[4],points[5]]], [points[6],points[7]],
            [proposal.root,nullifier,_hash(choice),_hash(scopeForProposal(id))], TREE_DEPTH);
        if(!valid) revert InvalidProof();
        usedNullifiers[id][nullifier] = true;
        if(choice == 1) proposal.yes++; else proposal.no++;
        emit VoteAccepted(id,nullifier,choice);
    }
    function _hash(uint256 value) private pure returns(uint256) { return uint256(keccak256(abi.encodePacked(value))) >> 8; }
}
