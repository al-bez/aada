import { 
  ButtonCell,
  Cell,
  LabeledData,
  LabeledDataWithAsset,
  Status,
  Background
} from "./helper"

export const Loan = ({ status, userName, price, fee, time, collateral }) => {
  const handleLiquidate = () => {}

  return (
    <>
      <Background status={status}/>
      <LabeledData description="Borrower:" data={userName}/>
      <LabeledDataWithAsset description="Lended:" data={price}/>
      <LabeledData description="Timer:" data={time}/>
      <LabeledDataWithAsset description="Fee:" data={fee}/>
      <Status status={status} price={price}/>
      <Cell/>
      <ButtonCell onClick={handleLiquidate}>liquidate</ButtonCell>
      <LabeledDataWithAsset description="Collateral" data={collateral}/>
    </>
  )
}