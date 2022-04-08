import style from "./Dashboard.module.scss"
import arrow from "../../assets/images/dashboard/arrow.svg"
// not sure if it is an arrow but i assumed so.

import { useEffect, useState } from "react"
import { Spinner } from "react-bootstrap"
import { useRouter } from "next/router"
import Image from "next/image"

import AppContainer from "../ui/AppContainer"
import * as routes from "../../const/routes.const"
import { showError } from "../../client/services/notification.service"

import { loadTestData } from "./test"
import { getComponentByStatus } from "./rows"

/* ROW TYPES:
Waiting to be funded (Lender)
Waiting to be funded (Borrower)
Debt
Loan
Repayed
Liquidated
*/

const Dashboard = () => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [list, setList] = useState([])

  useEffect(() => {
    loadTestData(true).then(data => {
      setIsLoading(false)
      setList(data)
    }).catch(err => {
      showError({ message: err })
      router.push(routes.HOME)
    })
  }, [])

  if (isLoading) {
    return <Spinner animation="border" style={{ color: "white" }}/>
  }

  return (
    <AppContainer className={style.root}>
      <div className={style.body}>
        <div className={style.arrow}>
          <Image 
            width={15}
            height={15}
            src={arrow}
          />
        </div>
        {
          list.map(data => {
            const Component = getComponentByStatus(data)
            return (
              <div key={data.id} className={style.row}>
                <Component {...data}/>
              </div>
            )
          })
        }
      </div>
    </AppContainer>
  )
}

export default Dashboard