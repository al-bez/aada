import style from "../../Dashboard.module.scss"

import { Cell } from "./cell"
import { Logo } from "./logo"

export const LabeledData = ({ description, data }) => (
  <Cell>
    <p className={style.descFont}>{description}</p>
    <p className={style.dataFont}>{data}</p>
  </Cell>
)

export const LabeledDataWithAsset = ({ description, data }) => {
  const [, asset] = data.match(/\d+\s(\S+)/)
  return (
    <Cell>
      <p className={style.descFont}>{description}</p>
      <div className={style.iconContainer}>
        <p className={style.dataFont}>{data}</p>
        <Logo asset={asset}/>
      </div>
    </Cell>
  )
}