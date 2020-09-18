import React, {Component} from 'react';

export class Select extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {onChange, selectedOption, options} = this.props;
        let value;
        if (selectedOption) {
            value = selectedOption.value;
        }

        let optionList;
        if (options) {
            optionList = options.map((option, index) => {
                return (<option key={index} value={option.value}>{option.label}</option>)
            });
        }

        return (
            <select style={{width: '100%', height: '33px'}} onChange={(e) => {
                if (onChange) {
                    let option = e.target.options[e.target.selectedIndex];
                    onChange(option);
                }
            }}>
                {optionList}
            </select>
        )
    }
}