import glow from "../../assets/images/glow.gif";

const LoaderComponent = ({ modalHeading, modalPara, modalImage }) => {
  const modalSpinnerGraphic = modalImage ? modalImage : glow;  
  return (
    <div className="loaderModal">
      <div className="modalConnectWallet">
        <div className="spinnerWrapper">
          <img src={modalSpinnerGraphic} alt="" />
        </div>
        <h3>{modalHeading && modalHeading}</h3>
        <p>{modalPara && modalPara}</p>
      </div>
    </div>
  );
};

export default LoaderComponent;