module.exports = {
  checkMember: function(members, membername) {
    return (
      members.filter(function(member) {
        return member == membername;
      }).length > 0
    );
  },

  displayPosition: function(roleid) {
    if (roleid == 1) return 'Manager';
    else if (roleid == 2) return 'Programmer';
    else if (roleid == 3) return 'Quality Assurance';
  }
};
