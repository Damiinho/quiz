import { Component } from "react";
import PropTypes from "prop-types";

class RouteErrorBoundary extends Component {
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="route-error" role="alert">
        <strong>Nie udało się otworzyć tego ekranu.</strong>
        <span>Odśwież stronę albo wróć do menu głównego.</span>
        <button type="button" onClick={() => window.location.assign("/")}>Wróć do menu</button>
      </div>
    );
  }
}

RouteErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RouteErrorBoundary;