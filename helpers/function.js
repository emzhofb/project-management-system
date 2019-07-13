module.exports = {
  checkMember: function(members, membername) {
    return members.filter(function(member){
      return member == membername;
    }).length > 0;
  }
};
