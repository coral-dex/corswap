import * as React from 'react';
import {Modal, List} from 'antd-mobile'
import {showValue,risklist,getTokenDesc} from './utils/common'
import abi from './abi'
import i18n from '../i18n';

class SelectToken extends React.Component{
    render() {
        const {visible,onOk,tokens,balance,onClose} = this.props; 
        return (
           
            <div>
                <Modal visible={visible}
                       popup
                       animationType="slide-up"
                       closable={true}
                       onClose={()=>onClose(false)}
                >
                    <List renderHeader={() => <div>{i18n.t("selectToken")}</div>} className="popup-list">
                        {tokens.map((token, index) => (
                            <List.Item key={index} extra={balance&&balance.has(token)?showValue(balance.get(token),abi.getDecimalLocal(token)?abi.getDecimalLocal(token):18,3):"0.000"} onClick={()=>{
                                onOk(token)
                            }}>{token}
                            {risklist.indexOf(token)>-1 && <span style={{color:"red",fontSize:"10px"}}>{i18n.t('risk')}</span>}
                                {
                                    getTokenDesc(token)?<span style={{color:"green",fontSize:"8px"}}>({getTokenDesc(token)})</span>:""
                                }
                            </List.Item>
                        ))}
                    </List>
                </Modal>
            </div>
        );
    }
}

export default SelectToken