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

const writeCSVs = (data, filePathPrefix) => {
    const headers = ['address', 'reward_amount'];
    const headersGnosisMultisig = ['token_type','token_address','receiver','amount','id']
    const csvRows = [headers.join(',')];
    const csvSplittedRows=[];
    let totalAmount = 0
    let totalRecords = 0
    let splitBatch = 0
    data.forEach(row => {
        if(totalRecords==0 || totalRecords%500==0){
            csvSplittedRows.push([headersGnosisMultisig.join(',')])
            splitBatch++;
        }
        if(row.address && row.amount){
            csvRows.push(`${row.address},${row.amount}`);
            // this is gnosis multisig csv app format
            csvSplittedRows[splitBatch-1].push(`erc20,0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85,${row.address},${row.amount}`);
            totalAmount += parseFloat(row.amount);
            totalRecords++
        }
    });
    fs.writeFileSync(filePathPrefix+".csv", csvRows.join(os.EOL));
    console.log(`CSV file saved to ${filePathPrefix}.csv`);
    for(let i=0;i<csvSplittedRows.length;i++){
            const batchNo=i+1;
            const filename=filePathPrefix+"-batch-"+batchNo+".csv"
            fs.writeFileSync(filename, csvSplittedRows[i].join(os.EOL));
            console.log(`Batch ${batchNo} saved to ${filename}`);
    }
    
    return totalAmount;
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

    const filePathPrefix = path.join(dirPath, `rewards-epoch-${timestamp/1000}`);

    try {
        const jsonData = await fetchData(timestamp/1000);
        const rewardsData = jsonData.map(item => ({
            address: item.address,
            amount: item.amount
        }));

        const totalAmount=writeCSVs(rewardsData, filePathPrefix);
        console.log(`Total Amount: ${totalAmount}`);
    } catch (error) {
        console.error('Failed to fetch and write rewards data:', error.message);
    }
};

main();
