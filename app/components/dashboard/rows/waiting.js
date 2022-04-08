import { 
  Cell,
  ButtonCell,
  LabeledData,
  LabeledDataWithAsset,
  Status,
  Background
} from "./helper"

export const WaitingForLender = ({ status, price, fee, collateral }) => {
  const handleChange = () => {}
  const handleCancel = () => {}

  return (
    <>
      <Background status={status}/>
      <LabeledData description="Lender:" data="Waiting for lender"/>
      <LabeledDataWithAsset description="To borrow:" data={price}/>
      <Cell/>
      <LabeledDataWithAsset description="Fee:" data={fee}/>
      <Status status={status} price={price}/>
      <ButtonCell onClick={handleChange}>change</ButtonCell>
      <ButtonCell onClick={handleCancel}>cancel</ButtonCell>
      <LabeledDataWithAsset description="Collateral:" data={collateral}/>
    </>
  )
}

export const WaitingForBorrower = ({ status, price, fee, collateral }) => {
  const handleLend = () => {}

  return (
    <>
      <Background status={status}/>
      <LabeledData description="Borrower:" data="Waiting for borrower"/>
      <LabeledDataWithAsset description="To lend:" data={price}/>
      <Cell/>
      <LabeledDataWithAsset description="Fee:" data={fee}/>
      <Status status={status} price={price}/>
      <Cell/>
      <ButtonCell onClick={handleLend}>lend</ButtonCell>
      <LabeledDataWithAsset description="Collateral:" data={collateral}/>
    </>
  )
}