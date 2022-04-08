import style from "../../Dashboard.module.scss"
import ada from "../../../../assets/images/dashboard/logos/ada.svg"
import aada from "../../../../assets/images/dashboard/logos/aada.svg"
import min from "../../../../assets/images/dashboard/logos/min.svg"

import Image from "next/image"

const ICON_SIZE = 26

const mapIconToAsset = {
  "ADA": ada,
  "AADA": aada,
  "MIN": min
}

export const Logo = ({ asset }) => {
  const icon = mapIconToAsset[asset]

  return (
    <span className={style.logoIcon}>
      {icon && <Image src={icon} width={ICON_SIZE} height={ICON_SIZE} layout="fixed"/>}
    </span>
  )
}