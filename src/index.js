import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

// Required Assets
import site_logo_img from "./assets/site_logo.jpg"
import anon_account_img from "./assets/anon_account.png"

// @ts-check

// Globals
var account_name = "Anonimus";
var account_password = "";


/** @param {RequestInfo} url
 *  @param {string} send_data */
function serverFetch(relative_url, data = null) {

  let server_url;
  let client_url;

  // local
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined) {
    server_url = "http://localhost:3001/" + relative_url;
    client_url = "http://localhost:3000/";
  }
  // remote
  else {
    server_url = "https://contenthostingserver.herokuapp.com:443/" + relative_url;
    client_url = "https://contenthostingclient.herokuapp.com:443/";
  }

  let headers = new Headers();
  headers.set("Origin", client_url);
  headers.set("Content-Type", "application/json");
  headers.set("Access-Control-Request-Method", "POST");
  headers.set("Access-Control-Request-Headers", "Origin, Content-Type, Accept");

  let req_body = "";
  if (data !== null) {
    req_body = JSON.stringify(data);
  }

  let req = new Request(server_url, {
    method: "POST",
    mode: "cors",
    headers: headers,
    body: req_body,
  });

  return new Promise((resolve, reject) => {
    fetch(req).then(
      response => {
        if (response.status === 200) {
          response.json().then(
            res_body => resolve(res_body),
            fail => reject("failed to parse fetched json: " + fail));
        }
        else if (response.status === 500) {
          response.json().then(
            res_body => reject(res_body),
            fail => reject("failed to parse fetched json: " + fail));
        }
        else {
          return reject("bad response from server: " + response.statusText);
        }
      },
      fail => reject("network failure on fetch: " + fail));
  });
}


class HomeThreads extends React.Component {
  constructor(props) {
    super(props)
    this.state = {

      /** @type {ThreadCardParams[]} */
      thread_cards: [],
    }
  }

  loadThreadCards() {
    serverFetch("getHomeThreadCards").then(
      res => {
        if (res.err === "") {
          this.setState({
            thread_cards: res.thread_cards
          })
        }
        else {
          console.log(res.err);
        }
      },
      err => {
        console.log(err);
      }
    )
  }

  componentDidMount() {
    this.loadThreadCards();
  }

  // componentDidUpdate(prev_props) {
    
  // }

  render() {
    return (
      <div className="HomeThreads">
        {this.state.thread_cards.map((thread_card) => {
          return <ThreadCard key={thread_card.thread_id}
            thread_id={thread_card.thread_id}
            preview_img={thread_card.preview_img}
            thread_set_img={thread_card.thread_set_img}
            title={thread_card.title}
            thread_set_name={thread_card.thread_set_name}
            views={thread_card.views}
            date={new Date(thread_card.date)}
            layout="vertical"

            switchTo={this.props.switchToThread}
          />
        })}
      </div>
    );
  }
}


/** @param {number} num */
function SimplifyNumber(num) {
  if (num > 999_999) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  else if (num > 999) {
    return (num / 1000).toFixed(2) + "K";
  }

  return num.toString();
}

/** @param {number} num */
function SplitNumber(num) {
  let string_num = num.toString();
  let new_string_num = "";

  let digit_count = 0;
  for (let i = string_num.length - 1; i >=0; i--) {
    digit_count++;
    if (digit_count === 4) {
      new_string_num = string_num[i] + "." + new_string_num
      digit_count = 1;
    }
    else {
      new_string_num = string_num[i] + new_string_num;
    }
  }
  return new_string_num;
}

/** @param {Date} date */
function SimplifiedDate(date) {
  let months = date.getUTCMonth();
  if (months < 10) {
    months = "0" + months.toString();
  }
  else {
    months = months.toString();
  }

  return date.getUTCDay().toString() + "." + months + "." + date.getUTCFullYear().toString();
}

/** @param {{views: 0, date: Date, css_class: ""}} props */
function StyledViewsAndDate(props) {
  return (
    <div className={props.css_class}>
      <p>{SimplifyNumber(props.views)}</p>
      <p className="views">views</p>
      <p className="dot">{String.fromCharCode(0x2022)}</p>
      <p>{SimplifiedDate(props.date)}</p>
    </div>
  );
}


class ThreadCard extends React.Component {
  /** @param {ThreadCardParams} props */
  constructor(props) {
    super(props)

    this.switchTo_bind = this.switchTo.bind(this, props.thread_id);
  }

  switchTo(thread_id) {
    this.props.switchTo(this.props.thread_id);
  }

  render() {
    let card_context = (
      <div className="CardContext">
        <p className="title">{this.props.title}</p>
        <p className="thread_set">{this.props.thread_set_name}</p>
        <StyledViewsAndDate views={this.props.views}
          date={this.props.date}
          css_class={"stats"}
        />
      </div>
    );

    let render_content = null;
    if (this.props.layout === "vertical") {
      render_content = (
        <div className="VerticalThreadCard" onClick={this.switchTo_bind}>
          <div className="image">
            <img src={this.props.preview_img} alt="Thread Preview"></img>
          </div>
          <div className="description">
            <img className="ThreadSetImage" src={this.props.thread_set_img} alt="Thread Set"></img>
            {card_context}
          </div>
        </div>
      );
    }
    else {
      render_content = (
        <div className="HorizontalThreadCard" onClick={this.switchTo_bind}>
          <div className="image">
            <img src={this.props.preview_img} alt="Thread Preview"></img>
          </div>
          {card_context}
        </div>
      );
    }
    

    return render_content;
  }
}


class Comment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      upvotes: props.upvotes,
      downvotes: props.downvotes
    };

    // Bindings
  }

  render() {
    return (
      <div className="Comment">
        <img src={this.props.user_icon} alt="comment"></img>
        <div className="right_side">
          <div className="top_bar">
            <p className="user_name">{this.props.user_name}</p>
            <p className="date">{SimplifiedDate(new Date(this.props.date))}</p>
            <div className="up gray">
              <p className="upvotes_value">{this.state.upvotes}</p>
              <p className="upvotes_txt">up</p>
            </div>
            <div className="down gray">
              <p className="downvotes_value">{this.state.downvotes}</p>
              <p className="downvotes_txt">down</p>
            </div>
          </div>
          <div className="text">
            <p>{this.props.text}</p>
          </div>
          <div className="CommentBtns">
            <button className="reply_btn comment_btn">reply</button>
            <button className="hide_btn comment_btn">hide</button>
            <button className="delete_btn comment_btn">delete</button>
            <button className="report_btn">report</button>
          </div>
        </div>
      </div>
    );
  }
}


class Thread extends React.Component {
  constructor(props) {
    super(props)

    let layout;
    if (document.documentElement.clientWidth >= document.documentElement.clientHeight) {
      layout = "horizontal";
    }
    else {
      layout = "vertical";
    }

    this.state = {
      loaded: false,

      title: "",
      views: 0,
      date: new Date(),
      up_votes: 0,
      down_votes: 0,
      rating: 0,
      descp: "",

      thread_set_id: "",
      thread_set_img: "",
      thread_set_name: "",
      thread_set_subs: 0,
      subscribed: false,

      comments: [],
      thread_cards: [],

      // Visual
      layout: layout,
    }

    // Bindings
    this.setLayout = this.setLayout.bind(this);
    this.upvoteThread = this.upvoteThread.bind(this);
    this.downvoteThread = this.downvoteThread.bind(this);
    this.subscribeToThreadSet = this.subscribeToThreadSet.bind(this);
  }

  setLayout() {
    if (document.documentElement.clientWidth >= document.documentElement.clientHeight) {
      this.setState((prev) => {
        if (prev.layout === "vertical") {
          return {
            layout: "horizontal"
          };
        }
      })
    }
    else {
      this.setState((prev) => {
        if (prev.layout === "horizontal") {
          return {
            layout: "vertical"
          };
        }
      })
    }
  }

  loadThread(thread_id) {
    if (account_password !== "") {

      let data = {
        thread_id: thread_id,
        name: account_name,
        password: account_password
      };

      serverFetch("http://localhost:3001/getThreadLoggedIn", data).then(
        res => {
          this.setState({
            loaded: true,

            thread_id: this.props.thread_id,
            img: res.img,
            title: res.title,
            views: res.views,
            date: res.date,
            up_votes: res.up_votes,
            down_votes: res.down_votes,
            rating: res.rating,
            descp: res.descp,
            
            thread_set_id: res.thread_set_id,
            thread_set_img: res.thread_set_img,
            thread_set_name: res.thread_set_name,
            thread_set_subs: res.thread_set_subs,
            subscribed: res.subscribed,
            
            comments: res.comments,
            thread_cards: res.thread_cards,
          });
        },
        err => console.log(err)
      );
    }
    else {
      let data = {
        thread_id: thread_id
      };
  
      serverFetch("http://localhost:3001/getThread", data).then(
        res => {
          this.setState({
            loaded: true,
  
            thread_id: this.props.thread_id,
            img: res.img,
            title: res.title,
            views: res.views,
            date: res.date,
            up_votes: res.up_votes,
            down_votes: res.down_votes,
            rating: 0,
            descp: res.descp,
  
            thread_set_img: res.thread_set_img,
            thread_set_name: res.thread_set_name,
            thread_set_subs: res.thread_set_subs,
            subscribed: false,
            
            comments: res.comments,
            thread_cards: res.thread_cards,
          })
        },
        err => console.log(err)
      );
    }
  }

  componentDidMount() {
    window.onresize = this.setLayout;

    this.loadThread(this.props.thread_id);
  }

  componentDidUpdate(prev_props) {
    if (this.props.thread_id !== prev_props.thread_id ||
      this.props.user_logged_in !== prev_props.user_logged_in) 
    {
      this.loadThread(this.props.thread_id);
    }
  }

  upvoteThread() {
    if (account_password === "") {
      this.props.showLogIn();
    }
    else {
      let data = {
        name: account_name,
        password: account_password,
        thread_id: this.props.thread_id,
      }

      serverFetch("http://localhost:3001/upvoteThread", data).then(
        res => {
          switch (res) {
            case "add upvote": {
              this.setState(prev => {
                return {
                  rating: 1,
                  up_votes: prev.up_votes + 1
                };
              });
              break;
            }
            case "remove upvote": {
              this.setState(prev => {
                return {
                  rating: 0,
                  up_votes: prev.up_votes - 1
                };
              });
              break;
            }
            case "switch to upvote": {
              this.setState(prev => {
                return {
                  rating: 1,
                  up_votes: prev.up_votes + 1,
                  down_votes: prev.down_votes - 1
                }
              });
              break;
            }
            default: console.trace();
          }
        },
        err => console.log(err)
      );
    }
  }

  downvoteThread() {
    if (account_password === "") {
      this.props.showLogIn();
    }
    else {
      let data = {
        name: account_name,
        password: account_password,
        thread_id: this.props.thread_id,
      }

      serverFetch("http://localhost:3001/downvoteThread", data).then(
        res => {
          switch (res) {
            case "add downvote": {
              this.setState(prev => {
                return {
                  rating: -1,
                  down_votes: prev.down_votes + 1
                };
              });
              break;
            }
            case "remove downvote": {
              this.setState(prev => {
                return {
                  rating: 0,
                  down_votes: prev.down_votes - 1
                };
              });
              break;
            }
            case "switch to downvote": {
              this.setState(prev => {
                return {
                  rating: -1,
                  up_votes: prev.up_votes - 1,
                  down_votes: prev.down_votes + 1
                }
              });
              break;
            }
            default: console.trace();
          }
        },
        err => console.log(err)
      );
    }
  }

  subscribeToThreadSet() {
    if (account_password === "") {
      this.props.showLogIn();
    }
    else {
      let data = {
        name: account_name,
        password: account_password,
        thread_set_id: this.state.thread_set_id
      }

      serverFetch("http://localhost:3001/subscribeToThreadSet", data).then(
        res => {
          switch (res) {
            case "unsubscribed":
              this.setState(prev => {
                return {
                  thread_set_subs: prev.thread_set_subs - 1,
                  subscribed: false
                }
              });
              break;

            case "subscribed":
              this.setState(prev => {
                return {
                  thread_set_subs: prev.thread_set_subs + 1,
                  subscribed: true
                }
              });
              break;
            default: console.trace();
          }
        },
        err => console.log(err),
      );
    }
  }

  render() {
    if (!this.state.loaded) {
      return null;
    }

    // Rating Styling
    let up_btn_classes = "btn up";
    let down_btn_classes = "btn down";
    let bar_classes = "bar bar_color_off";
    let fill_classes = "fill fill_color_off"

    if (this.state.rating > 0) {
      up_btn_classes = "btn up up_on";
      bar_classes = "bar bar_color_gray";
      fill_classes = "fill fill_color_on";
    }
    else if (this.state.rating < 0) {
      down_btn_classes = "btn down down_on";
      bar_classes = "bar bar_color_on";
      fill_classes = "fill fill_color_gray";
    }

    let fill_width = "50%";
    if (this.state.up_votes || this.state.down_votes) {
      let num = (this.state.up_votes / (this.state.up_votes + this.state.down_votes)) * 100;
      fill_width = num.toString() + "%";
    }

    // Subscribe Button Styling
    let subscribe_btn_classes = "subscribe_btn subscribe_btn_on";
    let subscribe_btn_txt = "Subscribe";

    if (this.state.subscribed) {
      subscribe_btn_classes = "subscribe_btn subscribe_btn_off";
      subscribe_btn_txt = "Subscribed";
    }

    let content_footer = (
      <>
        <div className="title">
          <p>{this.state.title}</p>
        </div>
        <div className="content_stats">
          <div className="views">
            <p className="num">{SplitNumber(this.state.views)}</p>
            <p>views</p>
          </div>
          <div className="Rating">
            <div className="numbers">
              <div className={up_btn_classes} onClick={this.upvoteThread}>
                <p className="value">{SplitNumber(this.state.up_votes)}</p>
                <p>up</p>
              </div>
              <div className={down_btn_classes} onClick={this.downvoteThread}>
                <p className="value">{SplitNumber(this.state.down_votes)}</p>
                <p>down</p>
              </div>
            </div>
            <div className={bar_classes}>
              <div className={fill_classes} style={{width: fill_width}}></div>
            </div>
          </div>
        </div>
        <div className="ContentDescription">
          <img src={this.state.thread_set_img} alt="Thread Set"></img>
          <div className="right_side">
            <div className="ThreadSetbar">
              <div className="thread_set">
                <p className="name">{this.state.thread_set_name}</p>
                <div className="subs">
                  <p className="value">{SimplifyNumber(this.state.thread_set_subs)}</p>
                  <p>subs</p>
                </div>
              </div>
              <div className="thread_set_btns">
                <button className={subscribe_btn_classes} onClick={this.subscribeToThreadSet}>{subscribe_btn_txt}</button>
              </div>
            </div>
            <p className="description">{this.state.descp}</p>
          </div>
        </div>
      </>
    );

    let recomendations = (
      <div className="recomendations">
        {this.state.thread_cards.map(thread_card => {
          return <ThreadCard key={thread_card.thread_id}
            thread_id={thread_card.thread_id}
            preview_img={thread_card.preview_img}
            title={thread_card.title}
            thread_set_name={thread_card.thread_set_name}
            views={thread_card.views}
            date={new Date(thread_card.date)}
            layout={"horizontal"}

            switchTo={this.props.switchToThread}
          />
        })}
      </div>
    )

    let comments = (
      <div className="comments">
        {this.state.comments.map(comment => {
          return <Comment key={comment.id}
            id={comment.id}
            user_id={comment.user_id}
            user_name={comment.user_name}
            user_icon={comment.user_icon}

            text={comment.text}
            date={comment.date}
            upvotes={comment.upvotes}
            downvotes={comment.downvotes}
            is_deleted={comment.is_deleted}
            is_reported={comment.is_reported}
          />;
        })}
      </div>
    );

    let render_content = null;
    if (this.state.layout === "horizontal") {
      render_content = (
        <div className="ThreadHorizontal">
          <div className="left_side">
            <div className="ThreadContent">
              <img src={this.state.img} alt="thread content"></img>
            </div>
            <div className="ThreadContext">
              {content_footer}
              {comments}
            </div>
          </div>   
          {recomendations}
        </div>
      );
    }
    else {
      render_content = (
        <div className="ThreadVertical">
          <div className="ThreadContent">
            {/* <img src={this.state.img} alt="thread content"></img> */}
          </div>
          <div className="ThreadContext">
            {/* {content_footer} */}
            {/* {recomendations} */}
            {comments}
          </div>
        </div>
      );
    }

    return render_content;
  }
}

// class SubscriptionCardParams {
//   constructor() {
//     this.thread_set_id = "";
//     this.img = "";
//     this.name = "";
//     this.creator_name = "";
//     this.creator_img = "";
//     this.thread_count = 0;
//   }
// }

// /** @param {SubscriptionCardParams} props */
// function SubscriptionCard(props) {
//   return (
//     <div className="SubscriptionCard">
//       <div className="SubscriptionCardImage">
//         <img src={props.img} alt="Subscription"></img>
//       </div>
//       <div className="description">
//         <img src={props.creator_img} alt=""></img>
//         <div className="context">
//           <p className="name">{props.name}</p>
//           <p className="creator_name">{props.creator_name}</p>
//           <div className="thread_count">
//             <p>{props.thread_count}</p>
//             <p>threads</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// 5ec6af901e2e9134d8995674

class MainMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      account_icon_img: anon_account_img,

      // Overlays
      show_content_bar: false,
      show_account_menu: false,

      // Login Prompt
      show_login_prompt: false,
      login_name_error: false,
      login_password_error: false,
      disable_login_btn: true,

      // Site Content
      content_mode: "home",
      thread_id: "",
    }

    this.showContentBar = this.showContentBar.bind(this);
    this.toggleAccountMenu = this.toggleAccountMenu.bind(this);
    this.showLogIn = this.showLogIn.bind(this);
    this.disableOverlays = this.disableOverlays.bind(this);

    this.checkIfNameAndPasswordAreSet = this.checkIfNameAndPasswordAreSet.bind(this);
    this.logIn = this.logIn.bind(this);
    this.logOut = this.logOut.bind(this);

    this.switchToHome= this.switchToHome.bind(this);
    this.switchToThread = this.switchToThread.bind(this);
  }

  componentDidMount() {
    let req = {
      name: sessionStorage.getItem("account_name"),
      password: sessionStorage.getItem("account_password")
    };

    // if bad then fallback to local
    if (req.name === null || req.password === null) {

      req.name = localStorage.getItem("account_name");
      req.password = localStorage.getItem("account_password");

      if (req.name === null || req.password === null) {
        return;
      }
    }

    // DEVELOPMENT_ONLY
    //this.switchToThread("5ec6af901e2e9134d8995674");

    serverFetch("http://localhost:3001/logInUser", req).then(
      res => {
        if (res.err === "") {

          account_name = req.name;
          account_password = req.password;

          this.setState({
            account_icon_img: res.account_icon_img,
          })
        }
        else {
          console.log(res.err)
        }
      },
      err => {
        console.log(err);
      }
    )
  }

  showContentBar() {
    this.setState((prev) => {
      return prev.show_content_bar ? {show_content_bar: false} : {show_content_bar: true};
    });
  }

  toggleAccountMenu() {
    this.setState((prev) => {
      return prev.show_account_menu ? {show_account_menu: false} : {show_account_menu: true}
    })
  }

  showLogIn() {
    document.getElementById("LogInNameField").value = "";
    document.getElementById("LogInPasswordField").value = "";

    this.setState({
      show_account_menu: false,
      show_login_prompt: true,
      login_name_error: false,
      login_password_error: false,
      disable_login_btn: true,
    })
  }

  disableOverlays() {
    this.setState({
      show_content_bar: false,
      show_account_menu: false,
      show_login_prompt: false,
    })
  }

  checkIfNameAndPasswordAreSet() {
    /** @type {string} */
    let name = document.getElementById("LogInNameField").value;
    /** @type {string} */
    let password = document.getElementById("LogInPasswordField").value;

    if (name.length && password.length) {
      this.setState({
        disable_login_btn: false
      })
    }
    else {
      this.setState({
        disable_login_btn: true
      })
    }
  }

  logIn() {
    let req = {
      name: document.getElementById("LogInNameField").value,
      password: document.getElementById("LogInPasswordField").value
    };

    serverFetch("http://localhost:3001/logInUser", req).then(
      /** @param {LogInServerResponse} res */
      res => {
        if (res.err === "") {

          account_name = req.name;
          account_password = req.password;

          this.setState({          
            account_icon_img: res.account_icon_img,
            show_login_prompt: false,
          })

          sessionStorage.setItem("account_name", req.name);
          sessionStorage.setItem("account_password", req.password);

          localStorage.setItem("account_name", req.name);
          localStorage.setItem("account_password", req.password);
        }
        else if (res.err === "account name not found") {
          this.setState({
            login_name_error: true,
            login_password_error: false,
          });
        }
        else if (res.err === "wrong password") {
          this.setState({
            login_name_error: false,
            login_password_error: true,
          });
        }
      },
      err => {
        console.log(err);
      }
    )
  }

  logOut() {
    sessionStorage.clear();
    localStorage.clear();

    account_name = "Anonimus";
    account_password = "";

    this.setState({
      show_account_menu: false,  
      account_icon_img: anon_account_img,
    })
  }

  switchToHome() {
    this.setState({
      content_mode: "home",
    })
  }

  switchToThread(thread_id) {
    this.setState({
      content_mode: "thread",
      thread_id: thread_id,
    })
  }
  
  render() {
    let content_bar_left = "-252px";
    if (this.state.show_content_bar) {
      content_bar_left = "0px";
    }

    let account_dropdown = null;
    if (this.state.show_account_menu) {
      account_dropdown = (
        <div className="DropdownContent">
          <button className="Btn" onClick={this.showLogIn}>Log In</button>
          <button className="Btn">View Channel</button>
          <button className="Btn">Account Settings</button>
          <button className="Btn" onClick={this.logOut}>Log Out</button>
        </div>
      );
    }

    // Login Prompt
    let login_prompt_top = "-140px";
    if (this.state.show_login_prompt) {
      login_prompt_top = "50%";
    }

    let login_name_error_label = null;
    if (this.state.login_name_error) {
      login_name_error_label = (
        <p className="LoginError">(user name not found)</p>
      );
    }

    let login_password_error_label = null;
    if (this.state.login_password_error) {
      login_password_error_label = (
        <p className="LoginError">(wrong password)</p>
      );
    }

    // Background
    let background_click_receiver = null;
    if (this.state.show_content_bar || this.state.show_account_menu ||
      this.state.show_login_prompt)
    {
      background_click_receiver = (
        <div id="background_click_receiver" onClick={this.disableOverlays}></div>
      );
    }

    let site_content = null;
    switch (this.state.content_mode) {
      case "home": {
        site_content = (
          <HomeThreads
            switchToThread={this.switchToThread}
          />
        );
        break;
      }
      case "thread": {
        site_content = (
          <Thread
            user_logged_in={account_password !== ""}
            thread_id={this.state.thread_id}
            showLogIn={this.showLogIn}
            switchToThread={this.switchToThread}
          />
        );
        break;
      }
      default: 
    }

    return (
      <>
        {/* Display Fixed Stuff */}
        {background_click_receiver}
        <div className="LeftBar" style={{left: content_bar_left}}>
          <button className="Btn">Fresh Content</button>
          <button className="Btn">Subscriptions</button>
          <button className="Btn">Bookmarked Threads</button>
          <button className="Btn">Bookmarked Comments</button>
          <button className="Btn">Thread History</button>
          <button className="Btn">Comment History</button>
        </div>
        <div className="LogInPrompt" style={{top: login_prompt_top}}>
          <div className="LogInHeader">
            <img className="site_logo" src={site_logo_img} alt="site logo"></img>
            <p>Log in to TheEdge</p>
          </div>
          <div className="LoginLabel">
            <p>User Name</p>
            {login_name_error_label}
          </div>
          <input id="LogInNameField" className="LogInName" 
            onKeyUp={this.checkIfNameAndPasswordAreSet}></input>
          <div className="LoginLabel">
            <p>User Password</p>
            {login_password_error_label}
          </div>
          <input id="LogInPasswordField" className="LogInPassword" type="password" 
            onKeyUp={this.checkIfNameAndPasswordAreSet}></input>
          <button className="LogInBtn" disabled={this.state.disable_login_btn} 
            onClick={this.logIn}>Log In</button>
        </div>
        
        {/* Normal Stuff */}
        <div className="header_bar">
          <div className="site">
            <img className="site_logo" onClick={this.switchToHome} src={site_logo_img} alt="site logo"></img>
            <button className="MenuBtn" onClick={this.showContentBar}>Menu</button>
          </div>
          <input className="search_field" type="text" placeholder="Search"></input>
          <div className="AccountDrop">
            <div className="DropdowntBtn" onClick={this.toggleAccountMenu}>
              <p className="name">{account_name}</p>
              <img className="img" src={this.state.account_icon_img} alt=""></img>
            </div>
            {account_dropdown}
          </div>
        </div>
        <div className="site_content">
          {site_content}
        </div>
      </>
    );
  }
}

ReactDOM.render(
  <React.StrictMode>
    <MainMenu />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
