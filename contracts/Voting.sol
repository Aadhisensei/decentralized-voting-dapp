// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Decentralized Voting DApp
/// @notice A simple on-chain voting contract where the owner adds candidates and users cast one vote each.
contract Voting {
    // ─── State ───────────────────────────────────────────────────────────
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    address public owner;
    uint256 public candidateCount;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;

    // ─── Events ──────────────────────────────────────────────────────────
    event CandidateAdded(uint256 indexed candidateId, string name);
    event Voted(address indexed voter, uint256 indexed candidateId);

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the contract owner can perform this action");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Functions ───────────────────────────────────────────────────────

    /// @notice Add a new candidate (owner only).
    /// @param _name The name of the candidate.
    function addCandidate(string calldata _name) external onlyOwner {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
        emit CandidateAdded(candidateCount, _name);
    }

    /// @notice Cast a vote for a candidate. Each address may vote only once.
    /// @param _candidateId The ID of the candidate to vote for.
    function vote(uint256 _candidateId) external {
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;

        emit Voted(msg.sender, _candidateId);
    }

    /// @notice Get full details of a candidate.
    /// @param _candidateId The ID of the candidate.
    /// @return id   The candidate's ID.
    /// @return name The candidate's name.
    /// @return voteCount The number of votes received.
    function getCandidate(uint256 _candidateId)
        external
        view
        returns (uint256 id, string memory name, uint256 voteCount)
    {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        Candidate storage c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    /// @notice Return the total number of candidates.
    function getCandidateCount() external view returns (uint256) {
        return candidateCount;
    }
}
