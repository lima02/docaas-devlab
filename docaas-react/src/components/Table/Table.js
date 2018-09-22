import React from 'react';
import './Table.css';

function importAll(r) {
    let images = {};
    r.keys().map((item, index) => { images[item.replace('./', '')] = r(item); });
    return images;
}
const images = importAll(require.context('../../images', false));

class Table extends React.Component {
    constructor(props) {
        super(props);
        this.state = {        };  
    }


    render() {
        console.log(this.props.deck.cards);
        this.props.deck.cards.map((object) => console.log(object));
        return (
            <div className="App-table">
                {this.props.deck.cards.map((object, i) => <img src={images[object]} className="App-card" alt="card" />)}
            </div>
        );
    }
}

  
  export default Table;