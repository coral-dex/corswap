import React, {Component} from 'react';
import '../style/style.css'
export class Select extends Component {
    render() {
        const {onChange, selectedOption, options} = this.props;
        let value;
        if (selectedOption) {
            value = selectedOption.value;
            console.log(selectedOption.value,"selectedOptionValue");
        }
        console.log(options , "options onchange");
        let optionList;
        if (options) {
            optionList = options.map((option, index) => {
                return (
                    <option className="options" key={index} value={option.value}>{option.label}</option>
                )
            });
        }

        return (
            <select className="select color" style={{width: '100%', height: '33px'}} onChange={(e) => {
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