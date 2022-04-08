import Link from "next/link";
import { useRouter } from "next/router";
//
import { mainLogoBase64String } from "../../assets/assets.const";
import { useState, useEffect } from "react";
import twitterLogo from "../../assets/images/twitter.svg";
import instagramLogo from "../../assets/images/instagram.svg";
import discordLogo from "../../assets/images/discord.svg";
import githubLoog from "../../assets/images/github.svg";
import avesomeLogo from "../../assets/images/avesome.svg";
import blockIcon from "../../assets/images/blockIcon.svg";
import successTick from "../../assets/images/successTick.svg";
import cross from "../../assets/images/cross.svg";
import bar from "../../assets/images/bar.svg";
import tick from "../../assets/images/tick.svg";

import LoaderComponent from "./LoaderComponent";
import CardanoApi from "../../client/cardano.api";
import MiddleEllipsis from "react-middle-ellipsis";
import { toast } from "react-toastify";
import AddressInputDialog from "../AddressInputDialog";
import AddressInputSuccessDialog from "../AddressInputSuccessDialog";
import UnlockedAADADialog from '../UnlockedAADADialog';
import * as routes from '../../const/routes.const';
import WalletConfirmDialog from '../WalletConfirmDialog';
import classNames from 'classnames';
import * as env from '../../const/env.const';
import WalletConnectionDialog from '../WalletConnectionDialog';
import { showError } from '../../client/services/notification.service';
import storageService from '../../client/services/storage.service';

let cardanoApi = null;

function NavbarComponent() {
  const router = useRouter();
  const { pathname } = router;
  const splitLocation = pathname.split("/");

  const [mobileMenu, setMobileMenu] = useState(false);
  const [successClaimMsg, setSuccessClaimMsg] = useState(false);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(false);
  const [loader, setLoader] = useState(false);

  const [showClaimAADADialog, setShowClaimAADADialog] = useState(false);
  const [showClaimAADADialogError, setShowClaimAADADialogError] = useState(false);
  const [showClaimAADADialogSuccess, setShowClaimAADADialogSuccess] = useState(false);
  const [showUnlockedAADADialog, setShowUnlockedAADADialog] = useState(false);
  const [walletConfirmDialog, setWalletConfirmDialog] = useState(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);

  const required_netwk = process.env.NEXT_PUBLIC_REACT_NETWORK;


  useEffect(() => {
    if (storageService.hasWalletName()) {
      const walletName = storageService.getWalletName();
      initCardanoWalletApi(walletName);
    }
  }, []);

  useEffect(() => {
    if (window.cardanoApi) {
      return;
    }
    if (storageService.hasWalletName()) {
      const walletName = storageService.getWalletName();
      initCardanoWalletApi(walletName);
    }
  }, [router.pathname]);

  async function initCardanoWalletApi(walletName) {
    try {
      console.log("Initialize cardano wallet: ", walletName);
      cardanoApi = new CardanoApi(walletName);
      const address = await cardanoApi.init();
      if (address) {
        setAddress(address);
        setConnected(true);
      }
    } catch (err) {
      disconnect();
      console.log({ err });
      const { code, info, message } = err;
      if (message) {
        if (message === 'no account set') {
          showError({ message: 'Please enable Dapp Account in your wallet' });
          return;
        }
        showError({ message });
        return;
      } else if (info) {
        if (info === 'no account set') {
          showError({ message: 'Please enable Dapp Account in your wallet' });
          return;
        }
        showError({ message: info });
        return;
      }
      showError({ message: 'Cannot connect to wallet!' });
    } finally {
      setShowConnectionDialog(false);
    }
  }

  const closeAllDialogs = () => {
    setShowClaimAADADialog(false);
    setShowClaimAADADialogError(false);
    setShowClaimAADADialogSuccess(false);
    setShowUnlockedAADADialog(false);
    setWalletConfirmDialog(false);
  };

  const claim_all_aada = async () => {
    try {
      if (!connected) {
        showNotification("You are not connected to wallet.");
        setLoader(false);
        return false;
      }
      const network = await cardanoApi.getNetworkId();
      if (!(network["network"] === required_netwk)) {
        showNotification(`Please change network to ${required_netwk}.`);
        setLoader(false);
        return false;
      }
      setLoader(true);
      const collateral = await cardanoApi.claim_aada();
      if (collateral.hasOwnProperty("error")) {
        showNotification(collateral["error"]);
      } else {
        showSuccessNotification(collateral);
      }
    } catch (err) {
      console.log({ err });
      if (err.name === 'custom') {
        showNotification(err.message);
        return;
      }
      showNotification('Something unexpected happened, unknown error');
    } finally {
      setLoader(false);
    }
  };

  const swapAADA = async () => {
    setLoader(true);
    if (!connected) {
      showNotification("You are not connected to wallet.");
      setLoader(false);
      return false;
    }
    const network = await cardanoApi.getNetworkId();
    if (!(network["network"] === process.env.NEXT_PUBLIC_REACT_NETWORK)) {
      showNotification(
        `Please change network to ${process.env.NEXT_PUBLIC_REACT_NETWORK}.`
      );
      setLoader(false);
      console.log(1);
      return false;
    }
    const bal = await cardanoApi.getBalance();
    let is_aada_token = false;
    if (bal.hasOwnProperty("assets")) {
      let assest = bal["assets"];
      console.log(
        `RequiredToken : ${process.env.NEXT_PUBLIC_SWAP_TOKEN_POLICY}`
      );
      assest.forEach(function (item, index) {
        if (item.hasOwnProperty("unit")) {
          if (item["unit"] === process.env.NEXT_PUBLIC_SWAP_TOKEN_POLICY) {
            is_aada_token = true;
          }
        }
      });
      if (!is_aada_token) {
        showNotification("You don’t have any AADA in your wallet.");
        setLoader(false);
        return false;
      }
    } else {
      showNotification("You don’t have any AADA in your wallet.");
      setLoader(false);
      return false;
    }


    if (is_aada_token) {
      await cardanoApi
        .getCollateral()
        .then((tx) => {
          var req = {
            address: address,
            tx_id: tx["transaction_id"],
          };
          try {
            (async () => {
              await cardanoApi.createSwapTx().then((response) => {
                if (response.hasOwnProperty("error") && response["error"]) {
                  showNotification(response["error"]);
                  setLoader(false);
                } else if (response.hasOwnProperty("tx")) {
                  showSuccessNotification("Transaction with AADA v1 was successfully queued.");
                  setLoader(false);
                }
              });
            })();
          } catch (err) {
            setLoader(false);
            showNotification(err.message);
          } finally {
          }
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };
  const showNotification = async (msg) => {
    toast.error(
      <div className="errorToaster">
        {" "}
        <div className="errorIcon">
          <img src={blockIcon} alt="" />
        </div>
        <div className="errorInfo">
          {" "}
          <h2>Message</h2>
          <p> {msg}</p>{" "}
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 50000,
        closeOnClick: true,
        autoClose: false,
        hideProgressBar: true,
      }
    );
  };

  const showSuccessNotification = async (msg) => {
    toast.error(
      <div className="errorToaster successess">
        {" "}
        <div className="errorIcon">
          <img src={tick} alt="" />
        </div>
        <div className="errorInfo">
          {" "}
          <h2>Message</h2>
          <p> {msg}</p>{" "}
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 50000000,
        closeOnClick: true,
        autoClose: false,
        hideProgressBar: true,
      }
    );
  };

  const openMenuOnMobile = () => {
    setMobileMenu(true);
  };

  const closeMenuOnMobile = () => {
    setMobileMenu(false);
  };

  const disconnect = () => {
    cardanoApi.disconnect();
    cardanoApi = null;
    setConnected(false);
  };

  return (
    <>
      {renderDialogs()}
      {renderHeader()}
    </>
  );

  function showWalletConfirmDialog() {
    router.push(routes.HOME).then(() => {
      closeAllDialogs();
      setWalletConfirmDialog({
        title: "CLAIM AADA WITH PUBLIC SALE RECEIPT",
        textBtn: "CLAIM",
        textTokens: [
          { text: "If you do not have a wallet, you can claim your AADA by sending Receipt NFT to:" },
          { copy: "addr1v8pzqtm43van9wrmlh8vdt4kl0rt7wz0kyvahv440dv22zsp6g6qd" },
          { text: "Shortly after you will receive AADA to your wallet." },
        ],
        handleActionClick: async (success) => {
          closeAllDialogs();
          if (success) {
            await claim_all_aada();
          }
          setWalletConfirmDialog(null);
        },
      });
    });
  };

  function connectWallet(walletName) {
    flint;
    cardanoApi;
    eternl;
    gero;
  }
  function renderDialogs() {
    return (
      <>
        {showConnectionDialog && (
          <WalletConnectionDialog
            close={() => {
              setShowConnectionDialog(false);
            }}
            connect={async walletName => {
              try {
                if (!window.cardano[walletName]) {
                  showError({ message: `${walletName.toUpperCase()} wallet extension required` });
                  return;
                }
                await initCardanoWalletApi(walletName);
              } catch (err) {
                console.log({ err });
                setShowConnectionDialog(false);
              }
            }}
          />
        )}

        <AddressInputDialog
          error={showClaimAADADialogError}
          isOpen={showClaimAADADialog}
          title={"TYPE IN YOUR ADDRESS"}
          handleClose={() => alert(1) && setShowClaimAADADialog(false)}
          handleActionClick={() => {
            if (showClaimAADADialogError) {
              closeAllDialogs();
              setShowUnlockedAADADialog(true);
              return;
            }
            setShowClaimAADADialogError(true);
          }}
        />


        <UnlockedAADADialog
          isOpen={showUnlockedAADADialog}
          handleClose={() => setShowClaimAADADialogSuccess(false)}
          handleActionClick={() => {
            closeAllDialogs();
            setShowClaimAADADialogSuccess(true);
          }}
        />

        <AddressInputSuccessDialog
          isOpen={showClaimAADADialogSuccess}
          title={"CLAIM AADA"}
          handleClose={() => setShowClaimAADADialogSuccess(false)}
          handleActionClick={() => {
            closeAllDialogs();
            alert("Success");
          }}
        />

        {walletConfirmDialog &&
          <WalletConfirmDialog {...walletConfirmDialog} />
        }

        {loader && (
          <LoaderComponent
            modalHeading={"Generating Transaction ..."}
            modalPara={"We are generating a transaction that will consume all your AADA v1 and swap to AADA v2."}
          />
        )}

        {successClaimMsg && (
          <LoaderComponent
            modalImage={successTick}
            modalHeading={"TX Successful!"}
            modalPara={"Your transaction was completely successful"}
          />
        )}
      </>
    );
  }

  function renderHeader() {
    const textTokens = process.env.NODE_ENV === env.PRODUCTION
      ? []
      : [
        { text: "If you don’t have wallet, you can swap tokens by sending them to:" },
        { copy: "addr1vxaq0fundw6a0kzden2sjdcgf2wcr2cvwz5eapz77mgkj6qqjnv3z" },
        { text: "Shortly after you will receive same amount of AADA v2 to your wallet." },
        { text: "Expect delay because of possible blockchain congestion." },
      ];

    const swapAadaV1ToV2 = () => {
      router.push(routes.HOME).then(() => {
        closeAllDialogs();
        setWalletConfirmDialog({
          title: "SWAP AADA v1 FOR AADA V2",
          subTitle: 'Swap using your wallet',
          textBtn: "SWAP",
          textTokens,
          handleActionClick: async (success) => {
            closeAllDialogs();
            if (success) {
              await swapAADA();
            }
            setWalletConfirmDialog(null);
          }
        });
      });
    };

    return (
      <div className="header-wrapper">
        <header className={mobileMenu ? "menu mobileMenuOpen " : "menu"}>
          <div className="logo-wrapper">
            <Link href="/">
              <a>
                <img src={mainLogoBase64String} alt="" />
              </a>
            </Link>
          </div>
          <div className="menu-item">
            <ul>
              <li className="showOnTablet crossButton">
                <button onClick={closeMenuOnMobile} className="transbutton">
                  <img src={cross} />
                </button>
              </li>
              <li>
                <a
                  href="#"
                  onClick={swapAadaV1ToV2}
                  className={classNames('text-decoration-none', { active: splitLocation[1] === "stake" })}
                >
                  SWAP AADA v1
                  <i className="menuBorder"></i>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={showWalletConfirmDialog}
                  className={classNames('text-decoration-none', { active: splitLocation[1] === "borrow" })}
                >
                  Claim AADA
                  <i className="menuBorder"></i>
                </a>
              </li>

              <li>
                <a href="#" onClick={() => {
                  if (process.env.NEXT_PUBLIC_HAS_STAKING) {
                    router.push(routes.STAKING);
                    return;
                  }
                  router.push(routes.STAKING);
                }}
                  className={classNames('text-decoration-none')}
                >
                  Staking
                  <i className="menuBorder"></i>
                </a>
              </li>

              <div className="social showOnTablet">
                {[twitterLogo, instagramLogo, discordLogo, githubLoog, avesomeLogo]
                  .map((logo, i) => (
                    <a href="" key={i}>
                      <img src={logo} alt="" />
                    </a>
                  ))}
              </div>
            </ul>

            <div className="toggleMenuONmobile showOnTablet">
              <button onClick={openMenuOnMobile} className="transbutton">
                <img src={bar} />
              </button>
            </div>
            <div className="menuactions">
              {connected && (
                <div
                  style={{
                    whiteSpace: "nowrap",
                    fontSize: "14px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    color: "white",
                    padding: "10px 15px",
                    lineHeight: "1.125rem",
                    textAlign: "center",
                    background: "linear-gradient(90deg, #34BCFF 0%, #28EBDD 100%)",
                  }}
                >
                  <span className="d-flex justify-content-center w-100">
                    <span style={{ width: "120px", whiteSpace: "nowrap" }}>
                      <MiddleEllipsis>
                        <span>{address}</span>
                      </MiddleEllipsis>
                    </span>
                    {/* <img
                      src={namiIcon}
                      alt=""
                      className="ml-2"
                      width={18}
                      height={18} /> */}
                    <span className="disconnectWallet" onClick={disconnect}>
                      x
                    </span>
                  </span>
                </div>
              )}
              {!connected && (
                <button className="btn-animated-btn" onClick={() => {
                  router.push(routes.HOME).then(() => {
                    setShowConnectionDialog(true);
                  });
                }}>
                  Connect{" "}
                  {/* <img src={namiIcon} className="ml-1" width={18} height={18} /> */}
                </button>
              )}
            </div>
          </div>
        </header>
      </div>
    );
  }
}

export default NavbarComponent;
