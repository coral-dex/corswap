const address = "3DJp9Gc4qvj5njk5Av9Tb2rLfWfqNsMiMAPsK9pWmgGfEG8mXcvUjFkLh25bF5fDN3XZwMBpFR2ybL5bfNXNCaBX";
const abi = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "myVotedProposalStatus",
		"outputs": [
			{
				"name": "_proposalStatus",
				"type": "uint8"
			},
			{
				"name": "_support",
				"type": "uint256"
			},
			{
				"name": "_oppose",
				"type": "uint256"
			},
			{
				"name": "_myStatus",
				"type": "uint8"
			},
			{
				"name": "_amount",
				"type": "uint256"
			},
			{
				"name": "_isSupport",
				"type": "bool"
			},
			{
				"name": "_creator",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "withDrawWithProposal",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_desc",
				"type": "string"
			}
		],
		"name": "estimateProposalFee",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "isBegin",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "ownedVotedProposals",
		"outputs": [
			{
				"name": "",
				"type": "uint256[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "proposalDetais",
		"outputs": [
			{
				"name": "_title",
				"type": "string"
			},
			{
				"name": "_desc",
				"type": "string"
			},
			{
				"name": "_startTime",
				"type": "uint64"
			},
			{
				"name": "_endTime",
				"type": "uint64"
			},
			{
				"name": "_fee",
				"type": "uint256"
			},
			{
				"name": "_minHoldAmount",
				"type": "uint256"
			},
			{
				"name": "_minParticipants",
				"type": "uint16"
			},
			{
				"name": "_status",
				"type": "uint8"
			},
			{
				"name": "_support",
				"type": "uint256"
			},
			{
				"name": "_oppose",
				"type": "uint256"
			},
			{
				"name": "_creator",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "_idCounter",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "allProposals",
		"outputs": [
			{
				"name": "",
				"type": "uint256[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getProposalFee",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "start",
				"type": "uint256"
			},
			{
				"name": "limit",
				"type": "uint256"
			}
		],
		"name": "getAllIds",
		"outputs": [
			{
				"name": "",
				"type": "uint256[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "owedVotedProposalsSize",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "proposalBanlance",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "ownedProposals",
		"outputs": [
			{
				"name": "",
				"type": "uint256[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "proposalsSize",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_desc",
				"type": "string"
			}
		],
		"name": "propsalFeeDetails",
		"outputs": [
			{
				"name": "_baseFee",
				"type": "uint256"
			},
			{
				"name": "_storageFee",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "propsalStatus",
		"outputs": [
			{
				"name": "_status",
				"type": "uint8"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "proposalTimes",
		"outputs": [
			{
				"name": "_createTime",
				"type": "uint64"
			},
			{
				"name": "_startTime",
				"type": "uint64"
			},
			{
				"name": "_endTime",
				"type": "uint64"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "propsalSpend",
		"outputs": [
			{
				"name": "_baseFee",
				"type": "uint256"
			},
			{
				"name": "_storageFee",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_id",
				"type": "uint256"
			}
		],
		"name": "isEnd",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "start",
				"type": "uint256"
			},
			{
				"name": "limit",
				"type": "uint256"
			}
		],
		"name": "ownedVotedProposalsWithLimit",
		"outputs": [
			{
				"name": "",
				"type": "uint256[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]