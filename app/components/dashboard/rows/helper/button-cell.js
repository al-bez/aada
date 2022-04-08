import style from "../../Dashboard.module.scss"

const alignedRightStyle = {
  display: "flex",
  alignItems: "flex-end"
} 
  
// it seems like every element in dashboard rows should be aligned left
// but only buttons are aligned right, now you don't need to specify it every time

export const ButtonCell = ({ children, onClick }) => (
  <div className={style.cell} style={alignedRightStyle}>
    <button className={style.button} onClick={onClick}>
    {children}
    </button>
  </div>
)