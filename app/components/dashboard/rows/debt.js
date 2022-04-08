import { 
  ButtonCell,
  Cell,
  LabeledData,
  LabeledDataWithAsset,
  Status,
  Background
} from "./helper"

export const Debt = ({ status, userName, price, fee, time, collateral }) => {
  const handleRepay = () => {}

  return (
    <>
      <Background status={status}/>
      <LabeledData description="Lender:" data={userName}/>
      <LabeledDataWithAsset description="Borrowed:" data={price}/>
      <LabeledData description="Timer:" data={time}/>
      <LabeledDataWithAsset description="Fee:" data={fee}/>
      <Status status={status} price={price}/>
      <Cell/>
      <ButtonCell onClick={handleRepay}>repay</ButtonCell>
      <LabeledDataWithAsset description="Collateral" data={collateral}/>
    </>
  )
}