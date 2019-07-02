var readline = require('readline');
var RL = readline.createInterface(process.stdin, process.stdout)
RL.question('What is your name?', function(name){
    
    var newName = name.toUpperCase();
   var newName = newName.split('').reverse();//split lai comma ma xuttauxa//

    var temp = '';
    for(var i=0; i< newName.length; i++){
        temp= temp + newName[i];
    }
    console.log(temp);

    RL.close();
});
