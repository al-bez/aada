import { Fragment } from "react"

import { Debt } from "./debt"
import { Loan } from "./loan"
import { WaitingForLender,WaitingForBorrower } from "./waiting"
import { Liquidated } from "./liquidated"
import { Repayed } from "./repayed"

const getComponentByStatus = data => {
  switch (data.status) {
    case "Waiting to be funded": { 
      return data.userType === "Borrower"
        ? WaitingForLender
        : WaitingForBorrower
    }
    case "Debt": return Debt
    case "Loan": return Loan
    case "Repayed": return Repayed
    case "Liquidated": return Liquidated
    default: return Fragment
  }
}

export { getComponentByStatus }