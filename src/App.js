import React, {Component} from 'react'
import './App.css';
import {HashRouter as Router,Switch,Route} from 'react-router-dom'
import {OrderList} from "./component/orderlist";
import {PairList} from "./component/pairlist";
import {Home} from "./component/home";
import {Exchange} from './component/exchange'

class App extends Component{

    render() {
        return <>
            <Router>
                <Switch>
                    <Route exact path="/buy"  component={Home}/>
                    <Route exact path="/sell" component={Exchange}/>
                    <Route exact path="/orderList"  component={OrderList}/>
                    <Route exact path="/pairlist" component={PairList}/>
                    <Route exact path="/"  component={Home}/>
                </Switch>
            </Router>
        </>
    }
}

export default App;
