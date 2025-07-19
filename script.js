// YoYo Test Chart
new Chart(document.getElementById('chartYoYo'), {
  type: 'bar',
  data: {
    labels: ['SMAT 2020-21', '2022', 'Pre-Season 2023'],
    datasets: [{
      label: 'YoYo Level',
      data: [16.2, 16.5, 16.7],
      backgroundColor: ['#3498db', '#2980b9', '#1abc9c']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'YoYo Test Results'
      }
    }
  }
});

// Standing Broad Jump Chart
new Chart(document.getElementById('chartSBJ'), {
  type: 'bar',
  data: {
    labels: ['2023'],
    datasets: [{
      label: 'SBJ (m)',
      data: [2.28],
      backgroundColor: '#3498db'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Standing Broad Jump'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

// Run A 3 Chart
new Chart(document.getElementById('chartRunA3'), {
  type: 'bar',
  data: {
    labels: ['SMAT 2020-21', '2021-22'],
    datasets: [{
      label: 'Run A 3 (sec)',
      data: [9.41, 9.34],
      backgroundColor: '#e74c3c'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Run A 3 Test'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
