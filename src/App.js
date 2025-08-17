
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExpensesSplitter from './components/expenses_splitter/ExpensesSplitter';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ExpensesSplitter />} />
      </Routes>
    </Router>
  );
}

export default App;
