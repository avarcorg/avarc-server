import React, {useEffect, useState} from 'react';
import axios from 'axios';
import config from "../../config/config";
import DashboardHeader from "./DashboardHeader";

axios.defaults.withCredentials = true; // Ensure cookies are sent with requests

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(config.apiUrl + '/auth/success', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Response:', response);  // Log the response


        setUser(response.data.data);  // Access the user data from the response
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };
    fetchUser();
  }, []);

  if (!user) {
    return <div className="App">
      <header className="App-header">
        <h1>Loading...</h1>
      </header>
    </div>;
  }

  return (<div className="App">
    <header className="App-header">
      <DashboardHeader/>
      <h1>Welcome, {user.username}!</h1>
      <p/>
      This is the dashboad, to do whatever we might like.
    </header>
  </div>);
}

export default Dashboard;
