import style from "../../Dashboard.module.scss"

import { Cell } from "./cell"
import { Logo } from "./logo"

const getInfoByStatus = status => {
  switch (status) {
    case "Waiting to be funded": return { color: "#FFB800", price: false }
    case "Debt": return { color: "#28EBDD", price: true }
    case "Loan": return { color: "#34BCFF", price: true }
    case "Repayed": return { color: "#28EBDD", price: false }
    case "Liquidated": return { color: "#E30000", price: false }
    default: return { color: "#FFFFFF", price: false }
  }
}

export const Status = ({ status, price }) => {
  const info = getInfoByStatus(status)
  const [, asset] = price.match(/\d+\s(\S+)/)
  return (
    <Cell>
      <p className={style.descFont}>Status:</p>
      <div className={style.iconContainer}>
        <p style={{ color: info.color }} className={style.dataFont}>
          {`${status} ${info.price ? price : ""}`}
        </p>
        {info.price && <Logo asset={asset}/>}
      </div>
    </Cell>
  )
}