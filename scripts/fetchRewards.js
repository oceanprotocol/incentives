const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');


const getYear = (date) => date.getFullYear()

const getCurrentWeekNumber = (currentDate) => {
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (currentDate - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const parseArguments = () => {
    const args = process.argv.slice(2);
    const argObj = {};
    args.forEach(arg => {
        const [key, value] = arg.split('=');
        argObj[key.replace('--', '')] = value;
    });
    return argObj;
};

const fetchData = async (date) => {
    const url = `https://incentive-backend.oceanprotocol.com/rewards?date=${date}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data: ' + error.message);
        throw error;
    }
};

const writeCSV = (data, filePath) => {
    const headers = ['address', 'reward_amount'];
    const csvRows = [headers.join(',')];
    data.forEach(row => {
        csvRows.push(`${row.address},${row.amount}`);
    });

    fs.writeFileSync(filePath, csvRows.join(os.EOL));
    console.log(`CSV file saved to ${filePath}`);
};

const main = async () => {
    const args = parseArguments();
    const timestamp = args.timestamp ? parseInt(args.timestamp) : Date.now();
    const providedDate = new Date(timestamp);
    const currentWeek = getCurrentWeekNumber(providedDate);
    const currentYear = getYear(providedDate)

    const dirPath = path.join(__dirname, '../data', `${currentYear}-week-${currentWeek}`);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `rewards-epoch-${timestamp/1000}.csv`);

    try {
        const jsonData = await fetchData(timestamp/1000);
        const rewardsData = jsonData.map(item => ({
            address: item.address,
            amount: item.amount
        }));

        writeCSV(rewardsData, filePath);
    } catch (error) {
        console.error('Failed to fetch and write rewards data:', error.message);
    }
};

main();
