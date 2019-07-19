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
  },

  filterMember: function(members, exceptions) {
    const listMember = [];
    
    for (let i = 0; i < members.rows.length; i++) {
      let flag = true;
      for (let j = 0; j < exceptions.rows.length; j++) {
        if (members.rows[i].firstname === exceptions.rows[j].firstname) {
          flag = false;
        }
      }
      if (flag) {
        listMember.push(members.rows[i]);
      }
    }

    return listMember;
  },

  displayDate: function(date) {
    const newDate = date.toString().split('T');
    
    return newDate[0];
  },

  changeDate: function(date) {
    const newDate = date.toString().split(' ');

    return newDate;
  }
};
