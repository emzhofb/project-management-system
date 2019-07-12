module.exports = {
  checkMember: function(members, membername) {
    for (let i = 0; i < members.length; i++) {
      if (members[i] === membername) {
        return true;
      }
      return false;
    }
  }
};
