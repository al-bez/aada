import { toast } from 'react-toastify';
import blockIcon from "../../assets/images/blockIcon.svg";


function _show({ success, message, cb }) {
  const className = `errorToaster ${success ? 'successess' : ''}`;
  toast.error(
    <div className={className}>
      <div className="errorIcon">
        {success ? '' : <img src={blockIcon} alt="" />}
      </div>
      <div className="errorInfo">
        <h2>Message</h2>
        <p> {message}</p>
      </div>
    </div>,
    {
      position: "top-right",
      autoClose: 3000,
      closeOnClick: true,
      hideProgressBar: true,
      onClose: () => {
        if (cb) {
          cb();
        }
      }
    }
  );
}

function showError({ message, cb }) {
  _show({ success: false, message, cb });
};

function showSuccess({ message, cb }) {
  _show({ success: true, message, cb });
};

export {
  showError,
  showSuccess,
};