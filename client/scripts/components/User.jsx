/** @jsx React.DOM */
'use strict';

var React = require('react');

var SessionActionCreators = require('../actions/SessionActionCreators');

// Single list element
var User = React.createClass({

  propTypes: {
    disabled: React.PropTypes.bool,
    showNames: React.PropTypes.bool,
    user: React.PropTypes.object.isRequired
  },

  getDefaultProps: function() {
    return {
      disabled: false,
      showNames: true
    };
  },

  handleClick: function() {
    if(!this.props.disabled) {
      // Call authenticate API and invoke action
      SessionActionCreators.authenticateUser(this.props.user);
    }
  },

  render: function() {
    var pictureEl, nameEl;

    if(this.props.showNames) {
      pictureEl =
        <div className="user-picture">
          <img className="userPic test img-circle"
            src={this.props.user.profilePicUrl} />
        </div>;

      nameEl =
        <div className="noPadLR profileHeight">
          <div className="userName vcenter noPadLR names profileHeight">{this.props.user.name}</div>
        </div>;

    } else {

      pictureEl =
          <img className="userPic test img-circle "
            src={this.props.user.profilePicUrl} />;

      nameEl = '';
    }

    return (
      <div className="user " onClick={this.handleClick}>
        {pictureEl}
        {nameEl}
      </div>
    );
  }
});

module.exports = User;