import NavbarComponent from "./NavbarComponent";
import classes from "./LayoutComponent.module.scss";
import AppContainer from "../ui/AppContainer";
import { ToastContainer } from "react-toastify";

function LayoutComponent(props) {
  return (
    <AppContainer className={classes.root}>
      <NavbarComponent />

      <AppContainer className={classes.main}>
        <video autoPlay muted loop>
          <source src="videos/globe.mp4" type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>

        <main className="main-wrapper">{props.children}</main>
        <ToastContainer />
      </AppContainer>
    </AppContainer>
  );
}

export default LayoutComponent;
