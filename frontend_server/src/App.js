import React,{useState,useEffect} from 'react';
import logo from './logo.svg';
import './App.css';

var md5 = require('md5');
var axios = require('axios');
var moment = require('moment');

const DisplayRegisterForm = (p)=>{
  const [userType,setUserType] = useState("Customer");
  const [registerState,setRegisterState] = useState("REGISTER");
  const [status,setStatus] = useState("Contacting Server...");
  const [contents,setContents] = useState("");
  const [errorMessage,setErrorMessage] = useState("");

  var fields = {
    "Customer":[
      {name:"Company Name",value:"companyname"},
      {name:"Name",value:"customername"},
      {name:"Email",value:"customeremail"},
      {name:"Phone Number",value:"customerphonenumber"},],
    "User":[
      {name:"First Name",value:"firstname"},
      {name:"Last Name",value:"lastname"},
      {name:"Email",value:"email"},],
    "Manufacturer":[
      {name:"Company Name",value:"companyname"},
      {name:"Contact Name",value:"contactname"},
      {name:"Contact Email",value:"contactemail"},
      {name:"Contact Phone Number",value:"contactphonenumber"},],
  }

  //var contents;
  //var errorMessage;

  var RegisterUser = ()=>{
    //First add a new customer/manufacturer/user

    var convertName = (type)=>{
      if (type!=="User") {
        return userType[0].toLowerCase()+userType.slice(1)
      } else {
        return "users"
      }
    }

    var myObj = {}
    var myData = {}
    var uniqueid = undefined;
    fields[userType].forEach((field)=>myObj[field.value]=document.getElementById(field.name).value)
    //console.log(myObj)
    axios.get('http://database/login/'+p.username)
    .then((data)=>{
      //setRegisterState("SERVER_CONTACT");
      setStatus("Preparing Account...");
      console.log(data.data)
      if (data.data.length>0) {
        return Promise.reject(new Error("Duplicate user detected"));
      } else {
        if (userType==="User") {
          return axios.post('http://database/'+convertName(userType)+'/adduser',myObj)
        } else {
          return axios.post('http://database/'+convertName(userType)+'/add',myObj)
        }
      }
    })
    .then((data)=>{
      //console.log(JSON.stringify(data));
      //data.id
      //setStatus(data);
      //myData = JSON.stringify(data);
      setStatus("Registering Account...");
      var uniqueid = data.data[0].id;
      var myObj = {uniqueid:uniqueid,username:p.username,password:md5(p.password),role:userType}
      return axios.post("http://database/logininfo/add",myObj)
    })
    .then((data)=>{
      //console.log(data)
      setStatus("Your account has been successfully registered! Please try logging in! (You will be redirected to the login page...)");
      p.setPassword("")
      p.setLoginPageMessage("Your account has been successfully registered! Please try logging in!")
      p.setReloadUserDatabase(true)
      p.setPageView("LOGIN")
    })
    .catch((err)=>{
      setRegisterState("REGISTER");
      setContents(<>
        <h2 style={{color:"red"}}>{err.message}</h2>
      </>);
    });
    //Then register a new user using the returned ID.
  }

  function Validated() {
    var inputs = document.getElementsByTagName("input");
    setErrorMessage("")
    for (var i=0;i<inputs.length;i++){var input=inputs[i]; input.classList.remove("error")}
    
    var empty_inputs = [] 
    for (var i=0;i<inputs.length;i++) {var input=inputs[i]; if (input.value.length===0){empty_inputs.push(input)}};

    if (empty_inputs.length>0) {
      setErrorMessage(<>
        <h2 style={{color:"red"}}>Please fix invalid fields!</h2>
      </>);
      for (var i=0;i<empty_inputs.length;i++){var input=empty_inputs[i]; input.classList.add("error")}
      return false;
    } else {
        return true;
    }
  }
  
  if (registerState!=="SERVER_CONTACT") {
    return (
      <>
      <div className="offset-md-3 col-md-6">
          {errorMessage}
          {contents}
          <h2>Register</h2><br/>
          <label for="type">User Type:</label>
          <select onChange={(e)=>{setUserType(e.currentTarget.value)}} value={userType} name="type" id="type">
            <option value="Customer">Customer</option>
            <option value="User">User</option>
            <option value="Manufacturer">Manufacturer</option>
            </select><br/><br/>
            {fields[userType].map((field)=><><br/><label for={field.name}><b>{field.name}:</b></label><input type="text" name={field.name} id={field.name}/></>)}
            <br/><br/>
            <label for="username"><b>Username:</b></label><input type="text" onChange={(e)=>{p.setUsername(e.currentTarget.value)}} id="username" name="username"/><br/>
            <label for="password"><b>Password:</b></label><input type="password" onChange={(e)=>{p.setPassword(e.currentTarget.value)}} id="password" name="password"/><br/><br/>
            <button onClick={()=>{if (Validated()) {
              RegisterUser();
              setRegisterState("SERVER_CONTACT")
            }}}>Register</button>
      </div>
      </>
    );
  } else {
    return (
      <>
      <div className="offset-md-3 col-md-6">
      <h2>Registering new {userType}</h2>
      {status}
      </div>
      </>
    )
  }
}

const DisplayLoginForm = (p)=>{
  const [status,setStatus] = useState("Contacting Server...")
  var contents = null;

  var LoginUser = ()=>{
    axios.get("http://database/login/"+p.username+"/"+md5(p.password))
    .then((data)=>{
      //setStatus(JSON.stringify(data))
      if (Array.isArray(data.data) && data.data.length>0) {
        //The first value should hold our uniqueid plus our role type.
        p.setRole(data.data[0].role)
        p.setUniqueId(data.data[0].uniqueid)
        setStatus("Found your data... Sending you to "+data.data[0].role+" homepage.")
        p.setPageView(data.data[0].role.toUpperCase())
      } else {
        Promise.reject("Invalid Username/Password Combination!")
      }
    })
    .catch((err)=>{
      setStatus(err.message);
      p.setLoginState("COULDNOTCONNECT")
    })
  }

  var VerifyFormInputs = ()=>{
    if (p.username && p.password && p.username.length>0 && p.password.length>0) {
      p.setLoginState("LOGGING IN")
      p.setLoginPageMessage("")
      LoginUser();
    } else {
      p.setLoginState("INVALID")
    }
  }

  switch (p.loginState) {
    case "FAILED":{
      contents = <h3 style={{color:"red"}}>Incorrect Credentials!</h3>;
    }break;
    case "COULDNOTCONNECT":{
      contents = <h3 style={{color:"red"}}>Could not contact server! Please try again!</h3>;
    }break;
    case "INVALID":{
      contents = <h3 style={{color:"red"}}>Please provide a valid username and password!</h3>;
    }break;
  }

  if (p.loginState!=="LOGGING IN") {
    return (
      <>
        {contents}
        <div className="offset-md-3 col-md-6">
        <h2>Login</h2><br/>
        <label for="username"><b>Username: </b></label>
        <input type="text" name="username" id="username" onChange={(e)=>{p.setUsername(e.currentTarget.value)}} value={p.username}/>
        <br/><br/>
        <label for="password"><b>Password: </b></label>
        <input type="password" name="password" id="password" onChange={(e)=>{p.setPassword(e.currentTarget.value)}} value={p.password}/>
        <br/><br/>
        <input type="submit" onClick={()=>{VerifyFormInputs()}} value="Login"/>
        <br/><br/>
        <span className="link" onClick={()=>{p.setPageView("REGISTER")}}>Need an account?</span>
      </div>
      </>
    );
  } else {
    return (
      <>
      <h2>Logging you in...</h2>
      {status}
      </>
    );
  }
}

const Item = (p)=>{
  var contents;
  if (p.items) {
    var thisItem = p.items.filter((item)=>item.id==p.id)[0];
    if (thisItem) {
      contents=<>
      <div className="row">
        <div className="col-md-4">
          <b>{thisItem.name}</b>
        </div>
        <div className="col-md-8">
          {thisItem.description}
        </div>
      </div>
      </>;
    } else {
      contents = "Could not find item "+p.id
    }
  }
    return (
      <>
        {contents}
      </>
    )
}

const User = (p)=>{
  var contents;
  if (p.users) {
    var thisUser = p.users.filter((user)=>user.id==p.id)[0];
    if (thisUser) {
      contents = thisUser.firstname +" "+thisUser.lastname
    }
  }
  return (
    <>
    {contents}
    </>
  )
}

const Manufacturer = (p)=>{
  var contents;
  if (p.manufacturers) {
    var thisManufacturer = p.manufacturers.filter((manufacturer)=>manufacturer.id==p.id)[0];
    if (thisManufacturer) {
      contents = thisManufacturer.companyname
    }
  }
  return (
    <>
    {contents}
    </>
  )
}

const SalesOrder = (p)=>{

  const CompleteOrder=()=>{
    var myObj={datereceived:moment().format()}
    axios.put("http://database/salesorder/setreceived/"+p.order.id,myObj)
    .then((data)=>{
      p.setReload(true)
    })
  }

  return (
    <>
    {(p.completeOrder && !p.order.datereceived)?<button onClick={()=>{CompleteOrder()}}>Complete Order</button>:<></>}{<Item id={p.id} items={p.items}/>}x{p.order.quantity} - <b>Submitted </b> to <b><User id={p.order.userid} users={p.users}/></b><br/><br/> <b>Ordered:</b> {p.order.dateordered}  -  <b>Received:</b> {(p.order.datereceived)?<div className="orderdone">{p.order.datereceived}</div>:"Order Pending..."}
  </>
  )
}

const PurchaseOrder = (p)=>{

  const CompleteOrder=()=>{
    var myObj={datereceived:moment().format()}
    axios.put("http://database/purchaseorder/setreceived/"+p.order.id,myObj)
    .then((data)=>{
      p.setReload(true)
    })
  }

  return (
    <>
    {(p.completeOrder && !p.order.datereceived)?<button onClick={()=>{CompleteOrder()}}>Complete Order</button>:<></>}{<Item id={p.id} items={p.items}/>}x{p.order.quantity} - <b>Submitted </b> to <b><Manufacturer id={p.order.manufacturerid} manufacturers={p.manufacturers}/></b><br/><br/> <b>Ordered:</b> {p.order.dateordered}  -  <b>Received:</b> {(p.order.datereceived)?<div className="orderdone">{p.order.datereceived}</div>:"Order Pending..."}
  </>
  )
}

const ItemsSelectionList = (p)=>{
  return (
    <>
    <select name="item" id="item" value={p.itemId} onChange={(e)=>{p.setItemId(e.currentTarget.value);}}>
       {p.items.map((item)=><option value={item.id}>{item.name}</option>)}
    </select>
    </>
  );
}

const UsersSelectionList = (p)=>{
  return (
    <>
    <select name="user" id="user" value={p.userId} onChange={(e)=>{p.setUserId(e.currentTarget.value);}}>
       {p.users.map((user)=><option value={user.id}>[{user.id}] {user.firstname+" "+user.lastname}</option>)}
    </select>
    </>
  );
}

const ManufacturerSelectionList = (p)=>{
  return (
    <>
    <select name="manufacturer" id="manufacturer" value={p.manufacturerId} onChange={(e)=>{p.setManufacturerId(e.currentTarget.value);}}>
       {p.manufacturers.map((manufacturer)=><option value={manufacturer.id}>[{manufacturer.id}] {manufacturer.companyname}</option>)}
    </select>
    </>
  );
}

const ModifyProfilePage = (p)=>{
  const [fields,setFields] = useState([]);
  const [updateRequired,setUpdateRequired] = useState(true);
  const [statusMessage,setStatusMessage] = useState("Retrieving data...");
  const [updatingProfile,setUpdatingProfile] = useState(false);
  //p.users,p.role,p.callback,p.username
  var data;

  if (updateRequired) {  
    setUpdateRequired(false)
    switch (p.role) {
      case "User":{
        var user = p.users.filter((user)=>user.id===p.id)[0]
        setStatusMessage("")
        setFields([{name:"First Name",value:"firstname",field:user.firstname},
        {name:"Last Name",value:"lastname",field:user.lastname},
        {name:"Email",value:"email",field:user.email}])
      }break;
      case "Customer":{
        axios.get("http://database/customer/view/"+p.id)
        .then((data)=>{
          if (Array.isArray(data.data) && data.data.length>0) {
            setFields([{name:"Company Name",value:"companyname",field:data.data[0].companyname},
            {name:"Name",value:"customername",field:data.data[0].customername},
            {name:"Email",value:"customeremail",field:data.data[0].customeremail},
            {name:"Phone Number",value:"customerphonenumber",field:data.data[0].customerphonenumber}])
            setStatusMessage("")
          } else {
            Promise.reject(new Error("Failed to retrieve data!"))
          }
        })
        .catch((err)=>{
          setStatusMessage(err.message)
        })
      }break;
      case "Manufacturer":{
        axios.get("http://database/manufacturer/view/"+p.id)
        .then((data)=>{
          if (Array.isArray(data.data) && data.data.length>0) {
            setFields([{name:"Company Name",value:"companyname",field:data.data[0].companyname},
            {name:"Contact Name",value:"contactname",field:data.data[0].contactname},
            {name:"Contact Email",value:"contactemail",field:data.data[0].contactemail},
            {name:"Contact Phone Number",value:"contactphonenumber",field:data.data[0].contactphonenumber}])
            setStatusMessage("")
          } else {
            Promise.reject(new Error("Failed to retrieve data!"))
          }
        })
        .catch((err)=>{
          setStatusMessage(err.message)
        })
      }break;
    }

  }

  function Validated() {
    var inputs = document.getElementsByTagName("input");
    setStatusMessage("")
    for (var i=0;i<inputs.length;i++){var input=inputs[i]; input.classList.remove("error")}
    
    var empty_inputs = [] 
    for (var i=0;i<inputs.length;i++) {var input=inputs[i]; if (input.value.length===0){empty_inputs.push(input)}};

    if (empty_inputs.length>0) {
      setStatusMessage(<>
        <h2 style={{color:"red"}}>Please fix invalid fields!</h2>
      </>);
      for (var i=0;i<empty_inputs.length;i++){var input=empty_inputs[i]; input.classList.add("error")}
      return false;
    } else {
        return true;
    }
  }

  function UpdateProfile() {
    setStatusMessage(<><h2>Contacting Server...</h2>
      Submitting updated profile...</>)
      switch (p.role) {
        case "User":{
          var myObj = {}
          fields.forEach((field)=>{myObj[field.value]=document.getElementById(field.value).value})
          axios.put("http://database/users/update/"+p.id,myObj)
          .then((data)=>{
              setStatusMessage("Success! Profile updated. Returning to previous page.")
              p.setReloadUserDatabase(true)
              p.call();
          })
          .catch((err)=>{
            setUpdatingProfile(false)
            setStatusMessage(err.message)
          })
        }break;
        case "Customer":{
          var myObj = {}
          fields.forEach((field)=>{myObj[field.value]=document.getElementById(field.value).value})
          axios.put("http://database/customer/update/"+p.id,myObj)
          .then((data)=>{
              setStatusMessage("Success! Profile updated. Returning to previous page.")
              p.call();
          })
          .catch((err)=>{
            setUpdatingProfile(false)
            setStatusMessage(err.message)
          })
        }break;
        case "Manufacturer":{
          var myObj = {}
          fields.forEach((field)=>{myObj[field.value]=document.getElementById(field.value).value})
          axios.put("http://database/manufacturer/update/"+p.id,myObj)
          .then((data)=>{
              setStatusMessage("Success! Profile updated. Returning to previous page.")
              p.call();
          })
          .catch((err)=>{
            setUpdatingProfile(false)
            setStatusMessage(err.message)
          })
        }break;
    }
  }

  if (updatingProfile) {
    return (
      <>
      {statusMessage}
      </>
    )
  } else {
    return (
      <>
        <button onClick={()=>{p.call()}}>{"< Back"}</button>
        <br/>
        <h3>Modify Profile for {p.username}</h3>
        <b>Role: {p.role}</b><br/><br/>
        {statusMessage}<br/>
        {(fields)?fields.map((field,count)=><><label for={field.value}>{field.name}</label><input type="text" name={field.value} id={field.value} defaultValue={field.field}/><br/></>):<></>}
        <button onClick={()=>{if (Validated()) {UpdateProfile()}}}>Update Profile</button>
        <br/>
      </>
    )
  }
}

const CreateCustomerSalesOrder = (p)=>{
  const [itemId,setItemId] = useState(p.items[0].id);
  const [itemQuantity,setItemQuantity] = useState(1);
  const [userId,setUserId] = useState(p.users[0].id);
  const [status,setStatus] = useState(null);
  const [lastError,setLastError] = useState(null);

  function SubmitSalesOrder(){
    setStatus("Submitting Sales Order...");
    var obj = {customerid:p.id,itemid:itemId,userid:userId,quantity:itemQuantity,dateordered:moment().format()}
    axios.post("http://database/salesorder/add",obj)
    .then((data)=>{
      if (Array.isArray(data.data) && data.data.length>0) {
        //Successfully submitted order.
        setStatus("Order submitted! Returning back to orders page...")
        p.setPage(null);
      } else {
        Promise.reject("Order failed to submit!")
        setStatus(null)
      }
    })
    .catch((err)=>{
      setLastError(err.message)
      setStatus(null)
    })
  }

  if (status===null) {
    return (
      <>
        {lastError}<br/>
        <button onClick={()=>{p.setPage(null);}}>{"< Back"}</button>
        <br/><br/>
        <label for="item"><b>Requested Item:</b></label><ItemsSelectionList itemId={itemId} setItemId={setItemId} items={p.items}/> <label for="quantity"><b>Quantity:</b></label> x<input type="number" style={{width:"60px"}} name="quantity" id="quantity" value={itemQuantity} onChange={(e)=>{setItemQuantity(e.currentTarget.value)}}/>
        <Item id={itemId} items={p.items}/>
        <br/><br/>
        <label for="user"><b>Sales User:</b></label><UsersSelectionList users={p.users} userId={userId} setUserId={setUserId}/>
        <button onClick={()=>{SubmitSalesOrder()}}>Submit</button>
      </>
    )
  } else {
    return (
      <>
        {status}
      </>
    )
  }
}

const DisplayCustomerOrders = (p)=>{
  const [status,setStatus] = useState("Fetching orders...");
  const [orders,setOrders] = useState([]);
  const [reload,setReload] = useState(true);

  var FetchOrders = ()=>{
    axios.get("http://database/salesorder/bycustomerid/"+p.id)
    .then((data)=>{
      setOrders(data.data);
      setStatus("Done! ("+data.data.length+") orders found.")
    })
  }

  if (reload) {
    FetchOrders();
    setReload(false)
  }

  return(
    <>
    <div className="row">
      <div className="col-md-4">
        <button onClick={()=>{p.setPage("PROFILE")}}>Edit Profile</button>
      </div>
      <div className="offset-md-4 col-md-4">
        <button onClick={()=>{p.setPage("PLACEORDER")}}>New Sales Order +</button>
      </div>
    </div>
    <div className="row">
      <div className="col-md-12">
      {status}
      {orders.map((order)=><div className="order"><SalesOrder order={order} users={p.users} id={order.itemid} items={p.items}/></div>)}
      </div>
    </div>
    </>
  )
}

const DisplayUserOrders = (p)=>{
  const [status,setStatus] = useState("Fetching orders...");
  const [orders,setOrders] = useState([]);
  const [reload,setReload] = useState(true);

  var FetchOrders = ()=>{
    axios.get("http://database/salesorder/byuserid/"+p.id)
    .then((data)=>{
      setOrders(data.data);
      setStatus("Done! ("+data.data.length+") orders found.")
    })
  }

  if (reload) {
    FetchOrders();
    setReload(false)
  }

  return(
    <>
    <div className="row">
      <div className="col-md-12">
      {status}
      {orders.map((order)=><div className="order"><SalesOrder setReload={setReload} completeOrder={p.completeOrder} order={order} users={p.users} id={order.itemid} items={p.items}/></div>)}
      </div>
    </div>
    </>
  )
}

const CustomerPage = (p)=>{
  const [page,setPage] = useState(null); //This view has 3 pages: View orders, place orders, view / edit profile

  var contents;

  const changePage = ()=>{
    setPage(null)
  }

  switch (page) {
    case "PLACEORDER":{
      contents=<CreateCustomerSalesOrder items={p.items} id={p.id} users={p.users} setPage={setPage}/>;
    }break;
    case "PROFILE":{
      contents=<ModifyProfilePage id={p.id} users={p.users} role={p.role} call={changePage} username={p.username}/>;
    }break;
    default:{
      contents=<DisplayCustomerOrders setPage={setPage} id={p.id} items={p.items} users={p.users}/>;
    }
  }

  return (
    <>
      {contents}
    </>
  );
}

const CreateUserPurchaseOrder = (p)=>{
  const [itemId,setItemId] = useState(p.items[0].id);
  const [itemQuantity,setItemQuantity] = useState(1);
  const [manufacturerId,setManufacturerId] = useState(p.manufacturers[0].id);
  const [status,setStatus] = useState(null);
  const [lastError,setLastError] = useState(null);

  function SubmitPurchaseOrder(){
    setStatus("Submitting Purchase Order...");
    var obj = {userid:p.id,itemid:itemId,manufacturerid:manufacturerId,quantity:itemQuantity,dateordered:moment().format()}
    axios.post("http://database/purchaseorder/add",obj)
    .then((data)=>{
      if (Array.isArray(data.data) && data.data.length>0) {
        //Successfully submitted order.
        setStatus("Order submitted! Returning back to orders page...")
        p.setPage(null);
      } else {
        Promise.reject("Order failed to submit!")
        setStatus(null)
      }
    })
    .catch((err)=>{
      setLastError(err.message)
      setStatus(null)
    })
  }

  if (status===null) {
    return (
      <>
        {lastError}<br/>
        <button onClick={()=>{p.setPage(null);}}>{"< Back"}</button>
        <br/><br/>
        <label for="item"><b>Requested Item:</b></label><ItemsSelectionList itemId={itemId} setItemId={setItemId} items={p.items}/> <label for="quantity"><b>Quantity:</b></label> x<input type="number" style={{width:"60px"}} name="quantity" id="quantity" value={itemQuantity} onChange={(e)=>{setItemQuantity(e.currentTarget.value)}}/>
        <Item id={itemId} items={p.items}/>
        <br/><br/>
        <label for="user"><b>Manufacturer:</b></label><ManufacturerSelectionList manufacturers={p.manufacturers} manufacturerId={manufacturerId} setManufacturerId={setManufacturerId}/>
        <button onClick={()=>{SubmitPurchaseOrder()}}>Submit</button>
      </>
    )
  } else {
    return (
      <>
        {status}
      </>
    )
  }
}

const DisplayPurchaseOrders = (p)=>{
  const [status,setStatus] = useState("Fetching orders...");
  const [orders,setOrders] = useState([]);
  const [reload,setReload] = useState(true);

  var FetchOrders = ()=>{
    axios.get("http://database/purchaseorder/byuserid/"+p.id)
    .then((data)=>{
      setOrders(data.data);
      setStatus("Done! ("+data.data.length+") orders found.")
    })
  }

  if (reload) {
    FetchOrders();
    setReload(false)
  }

  return(
    <>
    <div className="row">
      <div className="col-md-12">
      {status}
      {orders.map((order)=><div className="order"><PurchaseOrder setReload={setReload} completeOrder={p.completeOrder} order={order} manufacturers={p.manufacturers} id={order.itemid} items={p.items}/></div>)}
      </div>
    </div>
    </>
  )
}

const DisplayManufacturerPurchaseOrders = (p)=>{
  const [status,setStatus] = useState("Fetching orders...");
  const [orders,setOrders] = useState([]);
  const [reload,setReload] = useState(true);

  var FetchOrders = ()=>{
    axios.get("http://database/purchaseorder/bymanufacturerid/"+p.id)
    .then((data)=>{
      setOrders(data.data);
      setStatus("Done! ("+data.data.length+") orders found.")
    })
  }

  if (reload) {
    FetchOrders();
    setReload(false)
  }

  return(
    <>
    <div className="row">
      <div className="col-md-12">
      {status}
      {orders.map((order)=><div className="order"><PurchaseOrder setReload={setReload} completeOrder={p.completeOrder} order={order} manufacturers={p.manufacturers} id={order.itemid} items={p.items}/></div>)}
      </div>
    </div>
    </>
  )
}

const UserPage = (p)=>{
  const [page,setPage] = useState(null); //This view has 3 pages: View orders, place orders, view / edit profile

  var contents;

  const changePage = ()=>{
    setPage(null)
  }

  switch (page) {
    case "PLACEORDER":{
      contents=<CreateUserPurchaseOrder items={p.items} id={p.id} manufacturers={p.manufacturers} users={p.users} setPage={setPage}/>;
    }break;
    case "PROFILE":{
      contents=<ModifyProfilePage setReloadUserDatabase={p.setReloadUserDatabase} id={p.id} users={p.users} role={p.role} call={changePage} username={p.username}/>;
    }break;
    default:{
      contents=
      <>
      <div className="row">
        <div className="col-md-4">
          <button onClick={()=>{setPage("PROFILE")}}>Edit Profile</button>
        </div>
        <div className="offset-md-4 col-md-4">
          <button onClick={()=>{setPage("PLACEORDER")}}>New Purchase Order +</button>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <h3>Current Purchase Orders:</h3>
          <DisplayPurchaseOrders setPage={setPage} id={p.id} items={p.items} manufacturers={p.manufacturers}/>
        </div>
        <div className="col-md-6">
          <h3>Your Sales Orders:</h3>
          <DisplayUserOrders completeOrder={true} setPage={setPage} id={p.id} items={p.items} users={p.users}/>
        </div>
      </div>
      </>
    }
  }

  return (
    <>
      {contents}
    </>
  );
}

const ModifyProducts = (p)=>{
  const [disabled,setDisabled] = useState(false)
  const [name,setName] = useState("")
  const [description,setDescription] = useState("")

  function SubmitItem() {
    setDisabled(true)
    var myObj={name:document.getElementById("name").value,description:document.getElementById("description").value}
    axios.post("http://database/item/add",myObj)
    .then((data)=>{
      p.setReloadItemDatabase(true)
      setDisabled(false)
    })
  }

    return (
      <>
        <button onClick={()=>{p.call()}}>{"< Back"}</button>
        <br/><br/>
        {p.items.map((item)=><Item items={p.items} id={item.id}/>)}
        <div className="row text-center">
          <div className="col-md-4"><label for="name"><b>Item Name:</b></label><input type="text" onChange={(e)=>{setName(e.currentTarget.value)}} value={name} id="name" disabled={disabled} /></div>
          <div className="col-md-8"><label for="description"><b>Description:</b></label><input type="text" onChange={(e)=>{setDescription(e.currentTarget.value)}} disabled={disabled} value={description} id="description"/></div>
          <br/>
          <button disabled={disabled} onClick={()=>{SubmitItem()}}>Submit New Product</button>
        </div>
      </>
    );
}

const ManufacturerPage = (p)=>{
  const [page,setPage] = useState(null); //This view has 3 pages: Create new Products, View orders, view / edit profile

  var contents;

  const changePage = ()=>{
    setPage(null)
  }

  switch (page) {
    case "PRODUCTS":{
      contents=<ModifyProducts setReloadItemDatabase={p.setReloadItemDatabase} id={p.id} items={p.items} users={p.users} role={p.role} call={changePage} username={p.username}/>;
    }break;
    case "PROFILE":{
      contents=<ModifyProfilePage id={p.id} users={p.users} role={p.role} call={changePage} username={p.username}/>;
    }break;
    default:{
      contents=
      <>
      <div className="row">
        <div className="col-md-4">
          <button onClick={()=>{setPage("PROFILE")}}>Edit Profile</button>
        </div>
        <div className="offset-md-4 col-md-4">
          <button onClick={()=>{setPage("PRODUCTS")}}>+ Add Products</button>
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <h3>Your Purchase Orders:</h3>
          <DisplayManufacturerPurchaseOrders completeOrder={true} setPage={setPage} id={p.id} items={p.items} manufacturers={p.manufacturers}/>
        </div>
      </div>
      </>
    }
  }

  return (
    <>
      {contents}
    </>
  );
}

function App() {
  const [itemDatabase,setItemDatabase] = useState([]);
  const [userDatabase,setUserDatabase] = useState([]);
  const [customerDatabase,setCustomerDatabase] = useState([]);
  const [manufacturerDatabase,setManufacturerDatabase] = useState([]);
  const [password,setPassword] = useState(null);
  const [username,setUsername] = useState(null);
  const [uniqueid,setUniqueId] = useState(null);
  const [role,setRole] = useState(null);
  const [loginState,setLoginState] = useState(null);
  const [pageView,setPageView] = useState("LOGIN");
  const [loginPageMessage,setLoginPageMessage] = useState("");
  const [reloadItemDatabase,setReloadItemDatabase] = useState(true);
  const [reloadUserDatabase,setReloadUserDatabase] = useState(true);
  const [reloadCustomerDatabase,setReloadCustomerDatabase] = useState(true);
  const [reloadManufacturerDatabase,setReloadManufacturerDatabase] = useState(true);

  if (reloadItemDatabase) {
    axios.get("http://database/item/view")
    .then((data)=>{
      setItemDatabase(data.data);
      setReloadItemDatabase(false);
    })
  }
  if (reloadUserDatabase) {
    axios.get("http://database/")
    .then((data)=>{
      setUserDatabase(data.data);
      setReloadUserDatabase(false);
    })
  }
  if (reloadCustomerDatabase) {
    axios.get("http://database/customer/view")
    .then((data)=>{
      setCustomerDatabase(data.data);
      setReloadCustomerDatabase(false);
    })
  }
  if (reloadManufacturerDatabase) {
    axios.get("http://database/manufacturer/view")
    .then((data)=>{
      setManufacturerDatabase(data.data);
      setReloadManufacturerDatabase(false);
    })
  }

  var contents = null;

  switch (pageView) {
    case "LOGIN":{
      contents=
      <>
      <h3>{loginPageMessage}</h3>
      <DisplayLoginForm setUniqueId={setUniqueId} role={role} setRole={setRole} setLoginPageMessage={setLoginPageMessage} setPageView={setPageView} setUsername={setUsername} setPassword={setPassword} setLoginState={setLoginState} loginState={loginState} username={username} password={password} />
      </>
      ;
    }break;
    case "REGISTER":{
      contents=
      <>
      <DisplayRegisterForm setReloadUserDatabase={setReloadUserDatabase} setPageView={setPageView} setLoginPageMessage={setLoginPageMessage} username={username} password={password} setUsername={setUsername} setPassword={setPassword}/>
      </>
    }break;
    case "MANUFACTURER":{
      contents=<div className="col-md-12">
      <h3>Manufacturer's Dashboard</h3>
      <ManufacturerPage setReloadItemDatabase={setReloadItemDatabase} setReloadManufacturerDatabase={setReloadManufacturerDatabase} id={uniqueid} customers={customerDatabase} manufacturers={manufacturerDatabase} items={itemDatabase} username={username} role={role} users={userDatabase} />
      </div>;
    }break;
    case "USER":{
      contents=<div className="col-md-12">
      <h3>User Dashboard</h3>
      <UserPage setReloadUserDatabase={setReloadUserDatabase} id={uniqueid} customers={customerDatabase} manufacturers={manufacturerDatabase} items={itemDatabase} username={username} role={role} users={userDatabase} />
      </div>;
    }break;
    case "CUSTOMER":{
      contents=<div className="col-md-12">
      <h3>Customer Dashboard</h3>
      <CustomerPage id={uniqueid} items={itemDatabase} username={username} role={role} users={userDatabase} />
      </div>;
    }break;
  }

  return (
    <>
    <div className="container">
    <div className="row pt-5 pb-5 card border text-center">
      {contents}
    </div>
    </div>
    </>
  );
}

const DisplayUserOrderForm = (p)=>{

  
  
}

export default App;
