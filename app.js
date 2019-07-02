//including express package
var express = require('express');
var app = express();


app.use(express.static('public')); //bootstrap.css lai link garyako//

//importing session and flash
var session=require('express-session');
var flash=require('connect-flash');

//importing express fileupload
var fileupload=require('express-fileupload');


//importing handlebars
var exhbs = require('express-handlebars');
var bodyParser = require('body-parser');    //node modules : body parser//
app.use(bodyParser.urlencoded({extended:true}));

//default template engine
app.set('view engine','handlebars');
app.engine('handlebars', exhbs({defaultLayout: 'home'}));

//setup session and flash
app.use(session({
    secret:'hjhgf',
    saveUninitialized:true,
    resave:false,
    cookie:{maxAge:60000}
}));
app.use(flash());

app.use((req,res,next) => {
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.userid = req.session.userid;
    next();
});

//including mysql
var mysql = require('mysql');
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'blog_app'
});
app.use(fileupload());

//connecting
con.connect(function(err){
    if(err) throw err;
    console.log('Database Connected Successfully!!');
});
//helper to check if user is logged in //2076-02-29
var isUserLoggedIn=(req,res,next) =>{
      if(!req.session.userid){
      req.flash('error_message','please login first!');    
      res.redirect('/');
      }else{
          next();

      }
};

var redirectHome=(req,res,next) =>{
    if(req.session.userid){
    res.redirect('/home');
    }else{
        next();

    }
};

app.get('/',redirectHome,(req, res)=>{
res.render('home/login');
});

app.get('/register',(req,res)=>{
   res.render('home/register');
});

app.post('/register',(req,res)=>{
    var firstname=req.body.firstname;
    var lastname=req.body.lastname;
    var email=req.body.email;
    var username=req.body.username;
    var password=req.body.password;

    var checkIfUserExist = "SELECT * FROM user WHERE username=?";
      con.query(checkIfUserExist,[username],(error,results)=>{
        if(results.length>0){
            res.render('home/register',{error:'user already exist'})
        }else{

            var userdata={ firstname, lastname, email, username, password};
            var insertUser='INSERT INTO user SET ?';
            con.query(insertUser, [userdata],(error, results)=>{
                if(error)throw error;
                
                res.redirect('/');
            });
    
        }
        if(error) throw error;
      });
    });

app.post('/login',redirectHome,(req,res)=>{
    var username=req.body.username;
    var password=req.body.password;


 var selectUser ="SELECT * FROM user WHERE username =? "  ;
  con.query(selectUser,[username],(error,results)=>{
         if(results.length == 1){

         var originalPassword = results[0].password;
        
         if(password == originalPassword)
         {
            req.session.userid = results[0].id;
            req.session.userName = results[0].username;
        req.flash('success_message','login successfull');
        res.redirect('/home');
         }
         else
         {
         req.flash('error_message','password does not exit');
         res.redirect('/');
             }

         }else 
         {
            req.flash('error_message','username does not exit');
            res.redirect('/');
         }
         if (error) throw error;
 }); 
});

    //load index

     app.get('/home',isUserLoggedIn,(req, res) => {
      con.query("SELECt * FROM post",(error,results)=>{  
        if(error){
            throw error;
        }
        results.forEach(post=>{
            var desc = post.description;
            post.description = desc.substring(0, 150)+ '....';
            //format date in proper format
            var rawdate = post.post_date;
            var newDate = new Date(rawdate);
            var fullYear = newDate.getFullYear();
            var fullMonth = newDate.getMonth();
            var fullDay = newDate.getDate();
            var formatted_date = fullYear + '-' + (fullMonth + 1) + '-'  + (fullDay + 1);

            post.post_date = formatted_date;

        });
        res.render('home/index',{post:results});
    });
});

app.get('/newpost',isUserLoggedIn,(req, res) => {
    res.render('home/newpost');
});

app.post('/createpost',isUserLoggedIn,function(req, res){ 
       var title = req.body.title;   
       var description = req.body.description;      
        var author = req.body.author;   
  //2076-02-29
  console.log(req.files);
     var image = req.files.image;
     var imageName = image.name;
    image.mv('./public/uploads/'+imageName,(error)=>{
       if(error) throw error;
//structuring date format
         var posted_date = Date();
       var newDate = new Date(posted_date);
         var fullYear = newDate.getFullYear();
       var fullMonth = newDate.getMonth();
        var fullDay = newDate.getDate();
          
   var formatted_date = fullYear + '-' + (fullMonth + 1) + '-'  + (fullDay + 1);
   
    var post_date = formatted_date;
       var post = {title: title, 
              description: description,
               image: imageName,
               author: author,
               post_date: formatted_date
};
con.query('INSERT INTO post SET ?', post,(error, results, fields)=>{
       if(error){ 
      
      throw error;
    
    }
  
  console.log(results);
});


res.redirect('/newpost');
});
});

app.get('/post_detail/:id',isUserLoggedIn,(req, res)=>{
       con.query('SELECT *FROM post WHERE id=?', req.params.id,function(error, results){
       if(error) return error;
       res.render('home/post_detail',{results:results[0]});
   });
});

app.get('/deletePost/:id',isUserLoggedIn,(req, res)=>{
       var deletePost= "DELETE FROM post WHERE id=?";
       con.query(deletePost, req.params.id, (error,results)=>{
           if(error) throw error;
           res.redirect('/');
       });
   });
app.get('/editPost/:id',isUserLoggedIn,(req,res)=>{
         var selectPost = "SELECT * FROM post WHERE id = ?";
           con.query(selectPost, req.params.id,(error, results)=>{
           if(error) throw error;
         res.render('home/edit_post',{results:results[0]});
     });
   });
app.post('/editpost/:id',isUserLoggedIn,(req, res)=>{
    var title = req.body.title;   
    var description = req.body.description;   
    var image = req.body.image;   
    var author = req.body.author;   

    var update_query = 'UPDATE post SET  title = ?,description = ?,image = ?,author = ? WHERE id = ?';
    con.query(update_query,[title,description,image,author,req.params.id],(error,results)=>{
        if(error) 
        throw error;
            res.redirect('/');
    });
});

app.get('/logout',isUserLoggedIn,(req, res)=>{
    req.session.destroy();
    res.redirect('/');
});

//listening to server
 app.listen(3000, (err, result) => {
     if (err) return err;
     console.log('server has started...');
 });
