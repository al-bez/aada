import style from "../../Dashboard.module.scss"

export const Cell = ({ children }) => (
  <div className={style.cell}>
    {children}
  </div>
)