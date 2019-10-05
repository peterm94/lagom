import './index.css';
import * as serviceWorker from './serviceWorker';
import * as React from "react";
import * as ReactDOM from "react-dom";
import {LagomGameComponent} from "./React/LagomGameComponent";
import {InspectorComponent} from "./React/InspectorComponents";
import {Downshaft} from "./examples/Downshaft/Downshaft";
import {HexGame} from "./examples/LD45/HexGame";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Col, Container, Row} from "reactstrap";

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

const game = new HexGame();

ReactDOM.render(
    <Container>
        <Row>
            <Col><LagomGameComponent game={game}/></Col>
            {/*<Col><InspectorComponent game={game}/></Col>*/}
        </Row>
    </Container>,
    document.getElementById("root"));