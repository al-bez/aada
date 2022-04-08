const TEST_LIST = [
  {
    id: "312dadfgud",
    status: "Debt",
    userType: "Lender",
    price: "1 MIN",
    fee: "2 ADA",
    time: "10d 10h 17min",
    userName: "addrr2816",
    collateral: "200 ADA"
  },
  {
    id: "tugwbegbwj",
    status: "Loan",
    userType: "Borrower",
    price: "200 AADA",
    fee: "0.5 ADA",
    time: "13d 17h 42min",
    userName: "addrr2816",
    collateral: "500 ADA"
  },
  {
    id: "hu34tu1tun",
    status: "Waiting to be funded",
    userType: "Borrower",
    price: "200 AADA",
    fee: "1 ADA",
    collateral: "500 ADA"
  },
  {
    id: "123o4oz2oa",
    status: "Repayed",
    userName: "addrr2816",
    userType: "Lender",
    price: "500 MIN",
    fee: "1 ADA",
    collateral: "100 ADA"
  },
  {
    id: "9ag8adsf9z",
    status: "Liquidated",
    userName: "addr1234",
    userType: "Lender",
    price: "500 MIN",
    fee: "100 ADA",
    collateral: "100 ADA"
  },
]

export const loadTestData = showError =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      showError
        ? resolve(TEST_LIST)
        : reject("TEST DATA FETCH ERROR")
    }, 1000)
  }
)