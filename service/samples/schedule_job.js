// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

"use strict";

var uuid = require('uuid');
var JobClient = require('azure-iothub').JobClient;

var connectionString = process.env.IOTHUB_CONNECTION_STRING;
var queryCondition = "deviceId IN ['<device Id 1>', '<device Id 2>']"; // example queryCondition = "deviceId IN ['MyDevice1', 'MyDevice2']"
// For a single device you can also set queryCondition as "deviceId = '<device id>'" . Example, "deviceId = 'MyDevice1'" 
var startTime = new Date();
var maxExecutionTimeInSeconds =  3600;

var jobClient = JobClient.fromConnectionString(connectionString);

// Schedule a device method call.
var methodParams = {
  methodName: 'methodName',
  payload: null,
  responseTimeoutInSeconds: 15 // set response timeout as 15 seconds 
};

var methodJobId = uuid.v4();
console.log('scheduling Device Method job with id: ' + methodJobId);
jobClient.scheduleDeviceMethod(methodJobId,
                               queryCondition,
                               methodParams,
                               startTime,
                               maxExecutionTimeInSeconds,
                               function(err) {
  if (err) {
    console.error('Could not schedule device method job: ' + err.message);
  } else {
    monitorJob(methodJobId, function(err, result) {
      if (err) {
        console.error('Could not monitor device method job: ' + err.message);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    });
  }
});

// Schedule a Twin update
var twinPatch = {
  etag: '*',
  tags: {
    state: 'WA'
  },
  properties: {desired: {}, reported: {}}
};

var twinJobId = uuid.v4();

console.log('scheduling Twin Update job with id: ' + twinJobId);
jobClient.scheduleTwinUpdate(twinJobId,
                             queryCondition,
                             twinPatch,
                             startTime,
                             maxExecutionTimeInSeconds,
                             function(err) {
  if (err) {
    console.error('Could not schedule twin update job: ' + err.message);
  } else {
    monitorJob(twinJobId, function(err, result) {
      if (err) {
        console.error('Could not monitor twin update job: ' + err.message);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    });
  }
});

function monitorJob (jobId, callback) {
  var jobMonitorInterval = setInterval(function() {
    jobClient.getJob(jobId, function(err, result) {
      if (err) {
        console.error('Could not get job status: ' + err.message);
      } else {
        console.log('Job: ' + jobId + ' - status: ' + result.status);
        if (result.status === 'completed' || result.status === 'failed' || result.status === 'cancelled') {
          clearInterval(jobMonitorInterval);
          callback(null, result);
        }
      }
    });
  }, 5000);
}
