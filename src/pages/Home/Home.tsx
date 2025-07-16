import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../components/common';
import { useApp } from '../../context/AppContext';
import './Home.css';

const Home: React.FC = () => {
  const { state, dispatch } = useApp();
  const [inputValue, setInputValue] = React.useState('');

  const handleThemeToggle = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  const handleButtonClick = () => {
    alert('Button clicked!');
  };

  return (
    <div className={`home ${state.theme}`}>
      <div className="home-container">
        <h1 className="home-title">Welcome to Your React App</h1>
        <p className="home-subtitle">
          This is a well-structured React application with TypeScript
        </p>
        
        <div className="home-demo">
          <div className="demo-section">
            <h3>Theme Toggle</h3>
            <p>Current theme: {state.theme}</p>
            <Button onClick={handleThemeToggle} variant="outline">
              Toggle Theme
            </Button>
          </div>

          <div className="demo-section">
            <h3>Input Component</h3>
            <Input
              value={inputValue}
              onChange={setInputValue}
              placeholder="Type something..."
              label="Demo Input"
            />
            <p>You typed: {inputValue}</p>
          </div>

          <div className="demo-section">
            <h3>Button Variants</h3>
            <div className="button-group">
              <Button onClick={handleButtonClick} variant="primary">
                Primary
              </Button>
              <Button onClick={handleButtonClick} variant="secondary">
                Secondary
              </Button>
              <Button onClick={handleButtonClick} variant="outline">
                Outline
              </Button>
            </div>
          </div>

          <div className="demo-section">
            <h3>Authentication Pages</h3>
            <p>Check out our beautiful login and register pages</p>
            <div className="button-group">
              <Link to="/login">
                <Button variant="primary">
                  Login Page
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary">
                  Register Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 