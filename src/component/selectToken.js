import * as React from 'react';
import {Modal, List} from 'antd-mobile'
import {showValue} from './utils/common'
import abi from './abi'
class SelectToken extends React.Component{
    render() {
        const {visible,onOk,tokens,balance} = this.props;
        return (
            <div>
                <Modal visible={visible}
                       popup
                       animationType="slide-up"
                >
                    <List renderHeader={() => <div>委托买入</div>} className="popup-list">
                        {tokens.map((token, index) => (
                            <List.Item key={index} extra={balance&&showValue(balance.get(token),abi.getDecimalLocal(token),3)} onClick={()=>{
                                onOk(token)
                            }}>{token}</List.Item>
                        ))}
                    </List>
                </Modal>
            </div>
        );
    }
}

export default SelectToken