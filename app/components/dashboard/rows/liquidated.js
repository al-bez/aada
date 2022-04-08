import { 
  LabeledData,
  LabeledDataWithAsset,
  Status,
  Background
} from "./helper"

export const Liquidated = ({ status, userName, price, fee, collateral }) => (
  <>
    <Background status={status}/>
    <LabeledData description="Lender:" data={userName}/>
    <LabeledDataWithAsset description="Borrowed:" data={price}/>
    <LabeledDataWithAsset description="Collateral:" data={collateral}/>
    <LabeledDataWithAsset description="Fee:" data={fee}/>
    <Status status={status} price={price}/>
  </>
)