import React, {Component} from 'react'
import './App.css';
import {HashRouter as Router,Switch,Route} from 'react-router-dom'
import {PairList} from "./component/pairlist";
import {Shares} from './component/shares'
import Swap from './component/swap'
import './i18n'
class App extends Component{

    render() {
        return <>
            <Router>
                <Switch>
                    <Route exact path="/swap"  component={Swap}/>
                    <Route exact path="/pairlist" component={PairList}/>
                    <Route exact path="/shares" component={Shares}/>

                    <Route exact path="/"  component={Swap}/>
                </Switch>
            </Router>
        </>
    }
}

export default App;
