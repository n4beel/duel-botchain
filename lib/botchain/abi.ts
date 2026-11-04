export const BOTCHAIN_ABI = [
  {
    "type": "function",
    "name": "ACCEPT_WINDOW",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_DAYS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_MEMO_BYTES",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_PAGE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_STAKE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_DAYS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_STAKE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "accept",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "byParty",
    "inputs": [
      {
        "name": "addr",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "ids",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "matches",
        "type": "tuple[]",
        "internalType": "struct Duel.Match[]",
        "components": [
          {
            "name": "a",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "b",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "state",
            "type": "uint8",
            "internalType": "enum Duel.State"
          },
          {
            "name": "numDays",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "aBits",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "bBits",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "acceptBy",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "startDay",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "stake",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "winner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "memoBlock",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      },
      {
        "name": "total",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "cancel",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "challenge",
    "inputs": [
      {
        "name": "opponent",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "numDays",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "memo",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "checkIn",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "daysDone",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "who",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "latest",
    "inputs": [
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "ids",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "matches",
        "type": "tuple[]",
        "internalType": "struct Duel.Match[]",
        "components": [
          {
            "name": "a",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "b",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "state",
            "type": "uint8",
            "internalType": "enum Duel.State"
          },
          {
            "name": "numDays",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "aBits",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "bBits",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "acceptBy",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "startDay",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "stake",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "winner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "memoBlock",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      },
      {
        "name": "total",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "matchCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "matchOf",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Duel.Match",
        "components": [
          {
            "name": "a",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "b",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "state",
            "type": "uint8",
            "internalType": "enum Duel.State"
          },
          {
            "name": "numDays",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "aBits",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "bBits",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "acceptBy",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "startDay",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "stake",
            "type": "uint128",
            "internalType": "uint128"
          },
          {
            "name": "winner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "memoBlock",
            "type": "uint32",
            "internalType": "uint32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pending",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "settle",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "status",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "today",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "startDay",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "dayNumber",
        "type": "int32",
        "internalType": "int32"
      },
      {
        "name": "canSettle",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "Accepted",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "startDay",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Cancelled",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Challenged",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "a",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "b",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "stake",
        "type": "uint128",
        "indexed": false,
        "internalType": "uint128"
      },
      {
        "name": "numDays",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "acceptBy",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "memo",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CheckedIn",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "who",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "dayIndex",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Settled",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "winner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "firstMissDay",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Withdrawn",
    "inputs": [
      {
        "name": "to",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyCheckedIn",
    "inputs": [
      {
        "name": "dayIndex",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "BadDays",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadMemo",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadOpponent",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BadStake",
    "inputs": [
      {
        "name": "min",
        "type": "uint128",
        "internalType": "uint128"
      },
      {
        "name": "max",
        "type": "uint128",
        "internalType": "uint128"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidState",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MatchNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotAPlayer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotChallenger",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotOpponent",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRunning",
    "inputs": [
      {
        "name": "startDay",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "numDays",
        "type": "uint8",
        "internalType": "uint8"
      }
    ]
  },
  {
    "type": "error",
    "name": "NothingToSettle",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NothingToWithdraw",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TooLate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongPayment",
    "inputs": [
      {
        "name": "expected",
        "type": "uint128",
        "internalType": "uint128"
      }
    ]
  }
] as const;
