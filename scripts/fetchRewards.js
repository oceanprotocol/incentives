const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const getEpochTime = () => Math.floor(Date.now() / 1000);

const getYear = () => new Date().getFullYear()

const getCurrentWeekNumber = () => {
    const currentDate = new Date();
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (currentDate - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
    const currentWeek = getCurrentWeekNumber();
    const currentYear = getYear()
    const epochTime = getEpochTime();

    const dirPath = path.join(__dirname, '../data', `${currentYear}-week-${currentWeek}`);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `rewards-epoch-${epochTime}.csv`);

    try {
        const jsonData = await fetchData(getEpochTime());
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
