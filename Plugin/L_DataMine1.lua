-- dataMine Plugin for Vera
-- (c) Chris Jackson


-- Service ID strings used by this device.
SERVICE_ID = "urn:cd-jackson-com:serviceId:DataMine1"

local jsonLib = "json-dm"
local tmpFilename = "/tmp/dataMine.tmp"

local dmLuaVersion = "0.967"

local mountLocal = ""

local timeoutPeriod = 12
local historyEnabled
local historyNextHour

local DATAMINE_CONFIG   = "dataMineConfig.json"
local DATAMINE_LOG_NAME = "dataMine: "
local DATAMINE_LOG_DIR  = "/dataMine/"
local DATAMINE_LOG_HIST = "History/"

local dataDirHistory    = "History/"

local FIRST_YEAR     = 1104516000
local LOGTIME_DAILY  = 31536000
local LOGTIME_HOURLY = 2419200
local LOGTIME_RAW    = 604800

local FIRSTLOG_RAW		= 1826
local FIRSTLOG_HOUR		= 456
local FIRSTLOG_DAY		= 35

local HISTORYSTATE_STOP			= 0
local HISTORYSTATE_INIT			= 1
local HISTORYSTATE_PROCESSING	= 2
local HISTORYSTATE_RUN			= 3
local HISTORYSTATE_STARTUP		= 4


local INVALID_VALUE = -9999989.1
local dataDir = nil
local configData = nil
local Debug = 0
local ChannelCnt = 0
local ChannelRec = 0
local loadTime = 0

local mountLocation = ""
local mountType     = ""
local mountPoint    = ""
local manualMount   = ""
local mountUUID     = ""


local TEMPERATURE_SERVICE			= "urn:upnp-org:serviceId:TemperatureSensor1"
local TEMPERATURE_VARIABLE			= "CurrentTemperature"
local HUMIDITY_SERVICE				= "urn:micasaverde-com:serviceId:HumiditySensor1"
local HUMIDITY_VARIABLE				= "CurrentLevel"
local BINARYLIGHT_SERVICE			= "urn:upnp-org:serviceId:SwitchPower1"
local BINARYLIGHT_VARIABLE			= "Status"
local LIGHTSENSOR_SERVICE			= "urn:micasaverde-com:serviceId:LightSensor1"
local LIGHTSENSOR_VARIABLE			= "CurrentLevel"
local ENERGY_SERVICE				= "urn:micasaverde-com:serviceId:EnergyMetering1"
local ENERGY_VARIABLE				= "Watts"
local SECURITY_SERVICE				= "urn:micasaverde-com:serviceId:SecuritySensor1"
local SECURITY_VARIABLE				= "Tripped"
local HEAT_SERVICE					= "urn:upnp-org:serviceId:TemperatureSetpoint1_Heat"
local HEAT_VARIABLE					= "CurrentSetpoint"
local COOL_SERVICE					= "urn:upnp-org:serviceId:TemperatureSetpoint1_Cool"
local COOL_VARIABLE					= "CurrentSetpoint"
local PRESSURE_SERVICE				= "urn:cd-jackson-com:serviceId:OWPressureSensor1"
local PRESSURE_VARIABLE				= "CurrentPressure"
local BATTERY_SERVICE				= "urn:micasaverde-com:serviceId:HaDevice1"
local BATTERY_VARIABLE				= "BatteryLevel"
local WXCONDITION_SERVICE			= "urn:upnp-micasaverde-com:serviceId:Weather1"
local WXCONDITION_VARIABLE			= "Condition"
local WXWINDDIR_SERVICE				= "urn:upnp-micasaverde-com:serviceId:Weather1"
local WXWINDDIR_VARIABLE			= "WindDirection"
local WXWINDSPEED_SERVICE			= "urn:upnp-micasaverde-com:serviceId:Weather1"
local WXWINDSPEED_VARIABLE			= "WindSpeed"
local WXWINDCOND_SERVICE			= "urn:upnp-micasaverde-com:serviceId:Weather1"
local WXWINDCOND_VARIABLE			= "WindCondition"
local SECURITYTRIPTIME_SERVICE		= "urn:micasaverde-com:serviceId:SecuritySensor1"
local SECURITYTRIPTIME_VARIABLE		= "LastTrip"


local	WxWindLookup = {}
WxWindLookup["North"] = 16
WxWindLookup["NNE"]   = 15
WxWindLookup["NE"]    = 14
WxWindLookup["ENE"]   = 13
WxWindLookup["East"]  = 12
WxWindLookup["ESE"]   = 11
WxWindLookup["SE"]    = 10
WxWindLookup["SSE"]   = 9
WxWindLookup["South"] = 8
WxWindLookup["SSW"]   = 7
WxWindLookup["SW"]    = 6
WxWindLookup["WSW"]   = 5
WxWindLookup["West"]  = 4
WxWindLookup["WNW"]   = 3
WxWindLookup["NW"]    = 2
WxWindLookup["NNW"]   = 1


local	DATATYPE_TEMPERATURE	= 1
local	DATATYPE_HUMIDITY		= 2
local	DATATYPE_SWITCH			= 3
local	DATATYPE_LIGHT			= 4
local	DATATYPE_ENERGY			= 5
local	DATATYPE_SECURITY		= 6
local	DATATYPE_TEMPSETHOT		= 7
local	DATATYPE_TEMPSETCOOL	= 8
local	DATATYPE_WEATHER		= 9
local	DATATYPE_BATTERY		= 10
local	DATATYPE_TIME			= 11

local dataTypeArray = {}
dataTypeArray[DATATYPE_TEMPERATURE]          = {}
dataTypeArray[DATATYPE_TEMPERATURE].Id       = DATATYPE_TEMPERATURE
dataTypeArray[DATATYPE_TEMPERATURE].Name	 = "Temperature"
dataTypeArray[DATATYPE_TEMPERATURE].Units	 = "°"
dataTypeArray[DATATYPE_HUMIDITY]             = {}
dataTypeArray[DATATYPE_HUMIDITY].Id          = DATATYPE_HUMIDITY
dataTypeArray[DATATYPE_HUMIDITY].Name        = "Humidity"
dataTypeArray[DATATYPE_HUMIDITY].Units       = "%"
dataTypeArray[DATATYPE_SWITCH]               = {}
dataTypeArray[DATATYPE_SWITCH].Id            = DATATYPE_SWITCH
dataTypeArray[DATATYPE_SWITCH].Name          = "Switch"
dataTypeArray[DATATYPE_SWITCH].Units	     = ""
dataTypeArray[DATATYPE_LIGHT]                = {}
dataTypeArray[DATATYPE_LIGHT].Id             = DATATYPE_LIGHT
dataTypeArray[DATATYPE_LIGHT].Name           = "Light Sensor"
dataTypeArray[DATATYPE_LIGHT].Units	         = ""
dataTypeArray[DATATYPE_ENERGY]               = {}
dataTypeArray[DATATYPE_ENERGY].Id            = DATATYPE_ENERGY
dataTypeArray[DATATYPE_ENERGY].Name          = "Energy Monitor"
dataTypeArray[DATATYPE_ENERGY].Units	     = "W"
dataTypeArray[DATATYPE_SECURITY]             = {}
dataTypeArray[DATATYPE_SECURITY].Id          = DATATYPE_SECURITY
dataTypeArray[DATATYPE_SECURITY].Name        = "Security Sensor"
dataTypeArray[DATATYPE_SECURITY].Units	     = ""
dataTypeArray[DATATYPE_TEMPSETHOT]           = {}
dataTypeArray[DATATYPE_TEMPSETHOT].Id        = DATATYPE_TEMPSETHOT
dataTypeArray[DATATYPE_TEMPSETHOT].Name      = "Temperature Setpoint (Heat)"
dataTypeArray[DATATYPE_TEMPSETHOT].Units	 = "°"
dataTypeArray[DATATYPE_TEMPSETCOOL]          = {}
dataTypeArray[DATATYPE_TEMPSETCOOL].Id       = DATATYPE_TEMPSETCOOL
dataTypeArray[DATATYPE_TEMPSETCOOL].Name     = "Temperature Setpoint (Cool)"
dataTypeArray[DATATYPE_TEMPSETCOOL].Units	 = "°"
dataTypeArray[DATATYPE_WEATHER]              = {}
dataTypeArray[DATATYPE_WEATHER].Id           = DATATYPE_WEATHER
dataTypeArray[DATATYPE_WEATHER].Name         = "Weather"
dataTypeArray[DATATYPE_WEATHER].Units	     = ""
dataTypeArray[DATATYPE_BATTERY]              = {}
dataTypeArray[DATATYPE_BATTERY].Id           = DATATYPE_BATTERY
dataTypeArray[DATATYPE_BATTERY].Name         = "Battery"
dataTypeArray[DATATYPE_BATTERY].Units	     = "%"
dataTypeArray[DATATYPE_TIME]                 = {}
dataTypeArray[DATATYPE_TIME].Id           	 = DATATYPE_TIME
dataTypeArray[DATATYPE_TIME].Name			 = "Time"
dataTypeArray[DATATYPE_TIME].Units		     = ""


local serviceTypeArray = {}
serviceTypeArray[ 0]          = {}
serviceTypeArray[ 0].Service  = TEMPERATURE_SERVICE
serviceTypeArray[ 0].Variable = TEMPERATURE_VARIABLE
serviceTypeArray[ 0].Type     = DATATYPE_TEMPERATURE
serviceTypeArray[ 1]          = {}
serviceTypeArray[ 1].Service  = HUMIDITY_SERVICE
serviceTypeArray[ 1].Variable = HUMIDITY_VARIABLE
serviceTypeArray[ 1].Type     = DATATYPE_HUMIDITY
serviceTypeArray[ 2]          = {}
serviceTypeArray[ 2].Service  = BINARYLIGHT_SERVICE
serviceTypeArray[ 2].Variable = BINARYLIGHT_VARIABLE
serviceTypeArray[ 2].Type     = DATATYPE_SWITCH
serviceTypeArray[ 3]          = {}
serviceTypeArray[ 3].Service  = LIGHTSENSOR_SERVICE
serviceTypeArray[ 3].Variable = LIGHTSENSOR_VARIABLE
serviceTypeArray[ 3].Type     = DATATYPE_LIGHT
serviceTypeArray[ 4]          = {}
serviceTypeArray[ 4].Service  = ENERGY_SERVICE
serviceTypeArray[ 4].Variable = ENERGY_VARIABLE
serviceTypeArray[ 4].Type     = DATATYPE_ENERGY
serviceTypeArray[ 5]          = {}
serviceTypeArray[ 5].Service  = SECURITY_SERVICE
serviceTypeArray[ 5].Variable = SECURITY_VARIABLE
serviceTypeArray[ 5].Type     = DATATYPE_SECURITY
serviceTypeArray[ 6]          = {}
serviceTypeArray[ 6].Service  = HEAT_SERVICE
serviceTypeArray[ 6].Variable = HEAT_VARIABLE
serviceTypeArray[ 6].Type     = DATATYPE_TEMPSETHOT
serviceTypeArray[ 7]          = {}
serviceTypeArray[ 7].Service  = COOL_SERVICE
serviceTypeArray[ 7].Variable = COOL_VARIABLE
serviceTypeArray[ 7].Type     = DATATYPE_TEMPSETCOOL
serviceTypeArray[ 8]          = {}
serviceTypeArray[ 8].Service  = PRESSURE_SERVICE
serviceTypeArray[ 8].Variable = PRESSURE_VARIABLE
serviceTypeArray[ 8].Type     = DATATYPE_WEATHER
serviceTypeArray[ 9]          = {}
serviceTypeArray[ 9].Service  = BATTERY_SERVICE
serviceTypeArray[ 9].Variable = BATTERY_VARIABLE
serviceTypeArray[ 9].Type     = DATATYPE_BATTERY
serviceTypeArray[10]          = {}
serviceTypeArray[10].Service  = WXCONDITION_SERVICE
serviceTypeArray[10].Variable = WXCONDITION_VARIABLE
serviceTypeArray[10].Type     = DATATYPE_WEATHER
serviceTypeArray[11]          = {}
serviceTypeArray[11].Service  = WXWINDDIR_SERVICE
serviceTypeArray[11].Variable = WXWINDDIR_VARIABLE
serviceTypeArray[11].Type     = DATATYPE_WEATHER
serviceTypeArray[11].Lookup   = WxWindLookup
serviceTypeArray[12]          = {}
serviceTypeArray[12].Service  = WXWINDSPEED_SERVICE
serviceTypeArray[12].Variable = WXWINDSPEED_VARIABLE
serviceTypeArray[12].Type     = DATATYPE_WEATHER
serviceTypeArray[13]          = {}
serviceTypeArray[13].Service  = WXWINDCOND_SERVICE
serviceTypeArray[13].Variable = WXWINDCOND_VARIABLE
serviceTypeArray[13].Type     = DATATYPE_WEATHER



-- Run once at Luup engine startup.
function initialise(lul_device)
	-- Help prevent race condition
	luup.io.intercept()

	luup.log(DATAMINE_LOG_NAME.."Initialising dataMine System ("..dmLuaVersion..")")

--	local url = "https://apps.mios.com/get_plugin_json2.php?plugin=1088&ap=".. luup.pk_accesspoint .."&HW_Key=".. luup.hw_key
--	local status, content = luup.inet.wget(url)
--	luup.log(DATAMINE_LOG_NAME.."status = "..status..", content = "..content)

	-- Delete files from previous version of dataMine (ie jqWidgets)
	removeOldVersion()

	-- The data directory is stored as a service variable to allow it to be
	-- read out before the config file.
	dataDir = luup.variable_get(SERVICE_ID, "SetDataDirectory", lul_device)
	if(dataDir == nil) then
		dataDir = DATAMINE_LOG_DIR
		luup.variable_set(SERVICE_ID, "SetDataDirectory", DATAMINE_LOG_DIR, lul_device)
	end

	-- Make sure the directory is terminated with a /
	if(string.sub(dataDir,-1,-1) ~= '/') then
		dataDir = dataDir..'/'
	end

	-- Get the USB UUID
	mountUUID = luup.variable_get(SERVICE_ID, "SetMountUUID", lul_device)
	if(mountUUID == nil) then
		mountUUID = ""
		luup.variable_set(SERVICE_ID, "SetMountUUID", "", lul_device)
	end

	-- Get the mount point
	mountPoint = luup.variable_get(SERVICE_ID, "SetMountPoint", lul_device)
	if(mountPoint == nil) then
		mountPoint = ""
		luup.variable_set(SERVICE_ID, "SetMountPoint", "", lul_device)
	end

	if(mountPoint == "" and mountUUID ~= "") then
		luup.log(DATAMINE_LOG_NAME.. "Mounting to UUID '"..mountUUID.."'")
		mountPoint = checkUUID(mountUUID)
		if(mountPoint == "") then
			luup.log(DATAMINE_LOG_NAME.. "No UUID mount '"..mountUUID.."' was found!")
		else
			luup.log(DATAMINE_LOG_NAME.. "Found UUID '"..mountUUID.."' at '"..mountPoint.."'")
		end
	end

	-- Do we want to manually mount the USB (or not mount at all!)
	manualMount = luup.variable_get(SERVICE_ID, "SetManualMount", lul_device)
	if(manualMount == nil) then
		manualMount = 0
		luup.variable_set(SERVICE_ID, "SetManualMount", 0, lul_device)
	end

	-- Get the timeout period
	timeoutPeriod = luup.variable_get(SERVICE_ID, "SetTimeoutPeriod", lul_device)
	if(timeoutPeriod == nil) then
		timeoutPeriod = 12
		luup.variable_set(SERVICE_ID, "SetTimeoutPeriod", 12, lul_device)
	end
	timeoutPeriod = tonumber(timeoutPeriod)
	if(timeoutPeriod < 5) then
		timeoutPeriod = 5
	elseif(timeoutPeriod > 30) then
		timeoutPeriod = 30
	end

	-- Is history enabled?
	historyEnabled = luup.variable_get(SERVICE_ID, "SetHistoryEnable", lul_device)
	if(historyEnabled == nil) then
		historyEnabled = 1
		luup.variable_set(SERVICE_ID, "SetHistoryEnable", historyEnabled, lul_device)
	end
	historyEnabled = tonumber(historyEnabled)
	if(historyEnabled > 0) then
		historyEnabled = 1
	else
		historyEnabled = 0
	end

	-- Set the logging variables so that the user sees "0" if there's an error
	luup.variable_set(SERVICE_ID, "ChannelCnt", ChannelCnt, lul_device)
	luup.variable_set(SERVICE_ID, "ChannelRec", ChannelRec, lul_device)

	if(tonumber(manualMount) == 1) then
		luup.variable_set(SERVICE_ID, "mountLocation", "** Manual", lul_device)
		luup.variable_set(SERVICE_ID, "mountType",     "** Manual", lul_device)

		os.execute("mkdir "..dataDir)

		luup.log(DATAMINE_LOG_NAME.."Manual mounting to ("..dataDir..")")
	else
		-- Check if the USB is mounted
		checkMount()

		-- Is the storage device mounted
		if(mountLocation ~= mountPoint) then
			luup.task("Mounting dataMine storage device ("..mountPoint..")", 2, string.format("%s[%d]", luup.devices[lul_device].description, lul_device), -1)
			luup.log(DATAMINE_LOG_NAME.."Mounting dataMine storage ("..mountPoint..") to ("..dataDir..")")

			os.execute("mkdir "..dataDir)
			os.execute("mount "..mountPoint.." "..dataDir)

			-- Recheck the mount
			checkMount()

			if(mountLocation ~= mountPoint) then
				luup.task("Mount point error: ".. mountLocation.."::"..mountPoint, 2, string.format("%s[%d]", luup.devices[lul_device].description, lul_device), -1)
				luup.log(DATAMINE_LOG_NAME.."Mount point error: ".. mountLocation.."::"..mountPoint)

				return
			end
		end
	end

	os.execute("mkdir "..dataDir .. dataDirHistory)

	-- Check if there's a GUI package to unpack
	local f=io.open("/www/dm/dataMineWeb.tar.gz","r")
	if f~=nil then
		local len = f:read(2)
		io.close(f)

		if(len ~= nil) then
			luup.log(DATAMINE_LOG_NAME.."Installing update of dataMine web application")
			luup.task("Installing update of dataMine web application", 2, string.format("%s[%d]", luup.devices[lul_device].description, lul_device), -1)

			os.execute("/bin/tar -C /www -xzvf /www/dm/dataMineWeb.tar.gz")

			f=io.open("/www/dm/dataMineWeb.tar.gz","w")
			if f~=nil then
				io.close(f)
			end
		end
	end


	local logfile = dataDir .. DATAMINE_CONFIG

	-- Remember the time we started. This can be used in the GUI to interpret a restart of the server
	loadTime = os.time()

	ChannelCnt = 0
	ChannelRec = 0

	-- If we make changes, we will need to save the configuration
	local configUpdated = false

	-- Load the JSON library
	json = require(jsonLib)

	-- Load the configuration file
	local inf = io.open(logfile, 'r')
	if(inf == nil) then
		luup.log(DATAMINE_LOG_NAME .. "ERROR: Unable to open config file for read :: " .. logfile)
	else
		local line = inf:read("*all")

		if(line == nil) then
			luup.log(DATAMINE_LOG_NAME .. "ERROR: Config file read failed")
			configData = nil
		elseif(string.len(line) == 0) then
			luup.log(DATAMINE_LOG_NAME .. "ERROR: Config file was zero length")
			configData = nil
		else
			-- workaround for newer JSON library!
			string.gsub(line, "%[%]", "%[{}%]")

			--luup.log(DATAMINE_LOG_NAME .. "CONFIG: " .. line)

			configData = json.decode(line)
			if(configData == nil) then
				luup.log(DATAMINE_LOG_NAME .. "ERROR: Config file not decoded")
			elseif(configData.Variables == nil) then
				luup.log(DATAMINE_LOG_NAME .. "ERROR: Config file not decoded - no variables")
			else
				-- Make sure the reference counter is initialised
				if(configData.nextId == nil) then
					configData.nextId = 1
					configUpdated = true
				end

				if(configData.LastWrite == nil) then
					configData.LastWrite = 0
				end

				for k,v in pairs (configData.Variables) do
					v.Device = tonumber(v.Device)

					if(v.Id == nil) then
						v.Id = configData.nextId
						configData.nextId = configData.nextId + 1
						configUpdated = true
					end

					ChannelCnt = ChannelCnt + 1
					if(v.LastRec == nil) then
						v.LastRec = 0
					end

					if(v.LastVal == nil) then
						v.LastVal = ""
					end

					if(v.DataType == nil) then
						v.DataType = getDataType(v)
						configUpdated = true
					elseif(v.DataType == 0) then
						v.DataType = getDataType(v)
						configUpdated = true
					end

					if(v.Units == nil) then
						v.Units = getUnits(v)
						configUpdated = true
					end

					if(v.DrowsyWarning == nil) then
						v.DrowsyWarning = 0
					end
					if(v.DrowsyError == nil) then
						v.DrowsyError = 0
					end
					if(v.DataOffset == nil) then
						v.DataOffset = 0
					end

					if(v.Alpha == 1) then
						if(type(v.Lookup) ~= "table") then
	--						luup.log(DATAMINE_LOG_NAME..v.Name.." is not table")
							v.Alpha = 0
						end
					end

					if(v.Alpha == 0 or v.Alpha == nil) then
						v.Lookup = nil
					end

					local LastValue = luup.variable_get(v.Service, v.Variable, v.Device)
					if(LastValue == nil) then
						v.Ghost = true
					else
						local LastRecTime, LastRecVal = getLastRecord(v, configData.LastWrite)
						if(LastRecTime ~= v.LastRec) then
							v.LastRec = LastRecTime
							configUpdated = true
						end
						-- If there was an updated "LastValue" from the log, then use it
						if(LastRecValue ~= v.LastVal and LastRecValue ~= nil) then
							v.LastVal = LastRecValue
						end

						if(v.LastVal ~= LastValue) then
							-- Vera thinks the value is different than we last logged, so let's get this updated
							-- This could happen if a change occurred when dataMine was starting
							luup.log(DATAMINE_LOG_NAME.."D["..v.Device.."] S["..v.Service.."] V["..v.Variable.."] newVal on startup is "..LastValue.." was "..v.LastVal)
							watchVariable(v.Device, v.Service, v.Variable, v.LastVal, LastValue)
						end

						v.LastVal = LastValue
						v.Ghost = false
					end

					v.Type = tonumber(v.Type)

					if(v.Logging == 1 and v.Ghost == false) then
						ChannelRec = ChannelRec + 1
						luup.variable_watch('watchVariable', v.Service, v.Variable, v.Device)
						luup.log(DATAMINE_LOG_NAME.."Watching: D["..v.Device.."] S["..v.Service.."] V["..v.Variable.."]")
						if(v.LastHistory == nil) then
							v.LastHistory = FIRST_YEAR
						end
					end


					-- ***************************************************************************
					-- ***************************************************************************
					-- ***************************************************************************
					-- ***************************************************************************
					-- History......

				end
			end
		end
	end

	luup.variable_set(SERVICE_ID, "ChannelCnt", ChannelCnt, lul_device)
	luup.variable_set(SERVICE_ID, "ChannelRec", ChannelRec, lul_device)

	if(configData == nil) then
		luup.log(DATAMINE_LOG_NAME .. "Reinitialising configuration structure")
		configData = {}
		configData.Variables = {}
		configData.Graphs = {}
		configData.nextId = 1
		configUpdated = true
	end

	if(configData.Graphs == nil) then
		configData.Graphs = {}
		configUpdated = true
	end

	if(configData.guiConfig == nil) then
		configData.guiConfig = {}
		configUpdated = true
	end

	-- Keep a reference of the SW version used to save this config
	configData.Version = dmLuaVersion
	if(configUpdated == true) then
		saveConfig(1)
	end

	-- Register handlers to serve the JSON data
	luup.register_handler("incomingCtrl", "dmCtrl")
	luup.register_handler("incomingData", "dmData")
	luup.register_handler("incomingList", "dmList")

	-- Prepare the history "thread"



	-- Startup is done.
	luup.log(DATAMINE_LOG_NAME .. "Startup complete")
end

-- Removes files from previous versions of GUI
function removeOldVersion()
	os.execute("rm -rf /www/dm/app/")
	os.execute("rm -rf /www/dm/jqwidgets/")
end

-- Delete backup config files
function cleanConfig()
	os.remove(logfile)
end

function getLastRecord(Channel, Last)
	local logfile
	local inf
    local LastTime = 0
	local LastValue
	local FirstWeek = Last
	if(Last < Channel.FirstRec) then
		FirstWeek = Channel.FirstRec
	end
	FirstWeek = math.floor(FirstWeek / LOGTIME_RAW)
	if(FirstWeek < FIRSTLOG_RAW) then
		FirstWeek = FIRSTLOG_RAW
	end
    local WeekNum  = math.floor(os.time() / LOGTIME_RAW)

    repeat
        logfile = dataDir .. Channel.Archive .. " [R"..WeekNum.."].txt"
--		luup.log(DATAMINE_LOG_NAME.."Trying "..logfile)
        inf = io.open(logfile, 'r')
        if(inf ~= nil) then
--			luup.log(DATAMINE_LOG_NAME.."Opened "..logfile)
			break;
        end
		WeekNum = WeekNum - 1
	until WeekNum < FirstWeek

	if(inf ~= nil) then
		while true do
			line = inf:read("*line")
			if(line == nil) then
				-- End of file
                break
			end

			local startp,endp = string.find(line,",",1)
			if(startp == nil) then
--				luup.log(DATAMINE_LOG_NAME .. "Error reading CSV >> " .. line .. "<<");
				break
			end
			LastTime  = tonumber(string.sub(line,1,startp-1))
			LastValue = string.sub(line,startp+1)
        end

        inf:close()
    end

--	luup.log(DATAMINE_LOG_NAME .. Channel.Name .." got " .. LastTime);
    return LastTime, LastValue
end

-- Check free disk space
function checkFreeSpace()
	os.execute("df "..dataDir..">"..tmpFilename)
	local fTmp=io.open(tmpFilename,"r")
	if fTmp ~= nil then
		local line = fTmp:read("*line")
		io.close(fTmp)

		if(line ~= nil) then
			words = {}
			for word in line:gmatch("[^%% ]+") do table.insert(words, word) end

			if(words[5] ~= nil) then
				luup.variable_set(SERVICE_ID, "diskSpace",   tonumber(words[3]), lul_device)
				luup.variable_set(SERVICE_ID, "diskPercent", tonumber(words[5]), lul_device)
			end
		else
			luup.log(DATAMINE_LOG_NAME .. "Error reading tmpfile during spacecheck")
		end
	else
		luup.log(DATAMINE_LOG_NAME .. "Error opening tmpfile during spacecheck")
	end

	os.execute("rm "..tmpFilename)
end

function checkUUID(UUID)
	local mount = ""

	os.execute("blkid | grep '"..UUID.."' >"..tmpFilename)
	local fTmp=io.open(tmpFilename,"r")
	if fTmp ~= nil then
		local line = fTmp:read("*line")
		io.close(fTmp)

		if(line ~= nil) then
			luup.log(DATAMINE_LOG_NAME .. "UUID = "..line)
			words = {}
			for word in line:gmatch('[^:" ]+') do table.insert(words, word) end

			if(words[3] == UUID) then
				mount = words[1]
			end
		else
			luup.log(DATAMINE_LOG_NAME .. "Error reading tmpfile during UUID check")
		end
	else
		luup.log(DATAMINE_LOG_NAME .. "Error opening tmpfile during UUID check")
	end

	os.execute("rm "..tmpFilename)

	return mount
end


-- Check the mount point
function checkMount()
	mountLocation = ""
	mountType     = ""

	local dirMP = dataDir
	if(string.sub(dirMP,-1,-1) == '/') then
		dirMP = string.sub(dataDir, 1, -2)
	end

	luup.log(DATAMINE_LOG_NAME .. dirMP)

	os.execute("mount | grep "..dirMP.." > "..tmpFilename)
	local fTmp=io.open(tmpFilename,"r")
	if fTmp ~= nil then
		local line = fTmp:read("*line")
		io.close(fTmp)

		if(line ~= nil) then
			luup.log(DATAMINE_LOG_NAME .. "Mounted: "..line)
			local cnt = 0
			for word in string.gmatch(line, "%S+") do
				if(cnt == 0) then
					mountLocation = word
				elseif(cnt == 4) then
					mountType = word
				end
				cnt = cnt + 1
			end
		else
			luup.log(DATAMINE_LOG_NAME .. "Error reading tmpfile during mountcheck")
		end
	else
		luup.log(DATAMINE_LOG_NAME .. "Error opening tmpfile during mountcheck")
	end

	luup.variable_set(SERVICE_ID, "mountLocation", mountLocation, lul_device)
	luup.variable_set(SERVICE_ID, "mountType",     mountType,     lul_device)

	os.execute("rm "..tmpFilename)
end

-- Derive default data type for known variables
function getDataType(channel)
	for k,v in pairs (serviceTypeArray) do
		if(v.Service == channel.Service and v.Variable == channel.Variable) then
			return v.Type
		end
	end

	return 0
end

-- Derive default data type for known variables
function getUnits(channel)
	for k,v in pairs (serviceTypeArray) do
		if(v.Service == channel.Service and v.Variable == channel.Variable) then
			return v.Units
		end
	end

	return 0
end

-- Derive default data lookup table (if set!) for known variables
function getLookup(channel)
	for k,v in pairs (serviceTypeArray) do
		if(v.Service == channel.Service and v.Variable == channel.Variable) then
			return v.Lookup
		end
	end

	return 0
end

-- Get the channel reference
function getChannelRef(Id)
	for k,v in pairs (configData.Variables) do
		if(v.Id == Id) then
			return k
		end
	end

	return -1
end

-- Watch Callback
function watchVariable(lul_device, lul_service, lul_variable, lul_value_old, lul_value_new)
	-- Calculate the week number
	local WeekNum = math.floor(os.time() / LOGTIME_RAW)
	local logfile = nil
	local varRef  = nil
	local varKey  = nil

	for k,v in pairs (configData.Variables) do
		if(v.Device==tonumber(lul_device) and v.Service==lul_service and v.Variable==lul_variable) then
			if(v.Logging == 0) then
				-- Return if logging is disabled for this variable
				return
			end
--			if(v.FirstRec == 0) then
--				json = require(jsonLib)

--				v.FirstRec = os.time()
--				saveConfig(1)
---			end

			-- logfile
			logfile = dataDir .. v.Archive .. " [R" .. WeekNum .. "].txt"

			-- Remember the last record time and value
			v.LastRec = os.time()
			v.LastVal = lul_value_new

			-- save reference
			varRef = v
			varKey = k
			break
		end
	end

	if(logfile == nil) then
		luup.log(DATAMINE_LOG_NAME .. "Logging error logging variable "..lul_device.."::"..lul_service.."::"..lul_variable)
		luup.log(DATAMINE_LOG_NAME .. "Didn't find variable!")
		return
	end

	-- Detect numerical values. If it's non numerical, keep a lookup table
	if(tonumber(lul_value_new) == nil) then
		if(varRef.Lookup == nil) then
			varRef.Lookup = {}
		end
		if(varRef.Lookup[lul_value_new] == nil) then
			local	max = 0
			for k,v in pairs (varRef.Lookup) do
				if(v > max) then
					max = v
				end
			end
--			luup.log(DATAMINE_LOG_NAME .. "---" .. varRef.Name .. "---" .. max)
			varRef.Lookup[lul_value_new] = max + 1
			varRef.Alpha = 1
			saveConfig(1)
		end
	end


--	luup.log ((DATAMINE_LOG_NAME .. logfile .. " WEEK:"..WeekNum.." watchVarVariable(%s/%s/%s/%s/%s)"):format (tostring(lul_device), lul_service, lul_variable, tostring(lul_value_old), tostring(lul_value_new)))

	local outf, err = io.open(logfile, 'a')
	if(outf == nil) then
		luup.log(DATAMINE_LOG_NAME .. "Logging error logging variable "..lul_device.."::"..lul_service.."::"..lul_variable)
		luup.log(DATAMINE_LOG_NAME .. "Unable to open file for write " .. logfile)
		luup.log(DATAMINE_LOG_NAME .. "Error: '" .. err .. "'")
	else
		outf:write(os.time() .. ',' .. tostring(lul_value_new) .. '\n')
		outf:close()
	end

	if(historyEnabled == 1 and varRef.historyState == HISTORYSTATE_RUN and varKey ~= nil and varRef.Alpha == 0) then
		lul_value_new = tonumber(lul_value_new)
		processStats(varKey, os.time(), lul_value_new)
	end
end


-- Write the current configuration to the "dataMineConfig.json" file
function saveConfig(doBackup)
	json = require(jsonLib)

	local fname = dataDir .. DATAMINE_CONFIG

	-- Rename the current config file as a backup
	if(doBackup == 1) then
		-- Rename the current file
		local frename = dataDir .. DATAMINE_CONFIG .. "." .. os.date() .. ".backup"
		frename = string.gsub(frename, ":", "-")
		ret, err = os.rename(fname, frename)
		if(ret == nil) then
			luup.log(DATAMINE_LOG_NAME .. "ERROR: Renaming '"..fname.."' to '" .. frename .. "' --> Error '" .. err)
		end
	end

	configData.LastWrite = os.time()

	-- Save the configuration
	local outf = io.open(fname, 'w')
	if(outf == nil) then
		luup.log(DATAMINE_LOG_NAME .. "ERROR: Unable to open config file for write " .. fname)
	else
		outf:write(json.encode(configData) .. '\n')
		outf:close()
	end

	-- Count the number of variables being logged
	ChannelCnt = 0
	ChannelRec = 0
	for k,v in pairs (configData.Variables) do
		ChannelCnt = ChannelCnt + 1
		if(v.Logging == 1) then
			ChannelRec = ChannelRec + 1
		end
	end

	luup.variable_set(SERVICE_ID, "ChannelCnt", ChannelCnt, lul_device)
	luup.variable_set(SERVICE_ID, "ChannelRec", ChannelRec, lul_device)
end

-- Get dataMine variable configuration
function incomingList(lul_request, lul_parameters, lul_outputformat)
--	luup.log(DATAMINE_LOG_NAME .. "incomingList: " .. lul_request)

	return json.encode(configData.Variables)
end

-- Return a list of variables being logged - in JSON
function returnList(device, service, variable)
	local lul_html = "NOK"
	for k,v in pairs (configData.Variables) do
		if(v.Device==device and v.Service==service and v.Variable==variable) then
			lul_html = '{"Variables":['..json.encode(v)..']}'
		end
	end

	return lul_html
end

-- Entry point for the control handler
function incomingCtrl(lul_request, lul_parameters, lul_outputformat)
--	luup.log(DATAMINE_LOG_NAME .. "incomingCtrl: " .. lul_request)

	local control  = lul_parameters.control
	local device   = tonumber(lul_parameters.device)
	local service  = lul_parameters.service
	local variable = lul_parameters.variable
	local vartype  = lul_parameters.type

	-- remove the control
	lul_parameters.control = nil

	if(control == "status") then								-- Get updated system information and any changes to variables
		return processStatus(lul_parameters)
	elseif(control == "saveVar") then							-- Save variable properties
		return controlSaveVariable(lul_parameters)
	elseif(control == "delVar") then							-- Delete a variable
		return controlDelVariable(lul_parameters)
	elseif(control == "saveGraph") then						-- Save a graph config
		return controlSaveGraph(lul_parameters)
	elseif(control == "listGraphs") then						-- Return the list of saved graphs
		return controlGetGraphList()
	elseif(control == "delGraph") then							-- Delete a saved graph
		return controlDeleteGraph(lul_parameters)
	elseif(control == "history") then							-- Reprocesses all history data for a variable
		return processHistory(device, service, variable)
	elseif(control == "graphtypes") then						-- Return the graph types
		return processGraphTypes()
	elseif(control == "vartypes") then							-- Return variable types
		return processVarTypes()
	elseif(control == "saveConfig") then						-- Save GUI configuration
		return controlSaveConfig(lul_parameters)
	elseif(control == "listConfig") then						-- Return the list of saved graphs
		return controlGetGUIConfig()
	end
end

-- Get updated system information and any changes to variables
function processStatus(lul_parameters)
	local last = 0
	local firstRec = 1
	local lul_html = '{"time":'.. os.time() ..',"reload":'.. loadTime ..',"Variables":['

	if(lul_parameters.last ~= nil) then
		last = tonumber(lul_parameters.last)
	end

	for k,v in pairs (configData.Variables) do
		if(v.LastRec >= last) then
			if(firstRec == 0) then
				lul_html = lul_html ..','
			end
			lul_html = lul_html .. '{"Id":'..v.Id..',"LastRec":'..v.LastRec..',"LastVal":"'..v.LastVal..'"}'
--			lul_html = lul_html .. '{"Id":'..k.Id..',"Type":'..v.Type..',"Device":'..v.Device..',"Service":"'..v.Service..'","Variable":"'..v.Variable..'","LastRec":'..v.LastRec..',"LastValue":"'..v.LastVal..'"}'
			firstRec = 0
		end
	end
	lul_html = lul_html .. ']}'

	return lul_html
end

-- Delete a graph
function controlDeleteGraph(lul_parameters)
	local id

	local Name = lul_parameters.name

	-- Look for the definition
	for k,v in pairs (configData.Graphs) do
		if(v.Name == Name) then
			table.remove(configData.Graphs, k)
		end
	end

	saveConfig(1)

	return json.encode(configData.Graphs)
end

-- Save a graph config
function controlSaveGraph(lul_parameters)
	local Channel
	local ChannelList = {}

	local newTable = {}
	newTable.Period   = 0
	newTable.Channels = {}

	local chName
    local chCnt
    local outCnt

    outCnt = 0
	chCnt = 0
    repeat
        chName = "channel"..chCnt
		if(lul_parameters[chName] ~= nul) then
			if(tonumber(lul_parameters[chName]) ~= 0) then
				ChannelList[outCnt] = {}
				ChannelList[outCnt].chan = tonumber(lul_parameters[chName])
--				ChannelList[outCnt].axis = tonumber(lul_parameters[chName])   axis
				outCnt = outCnt + 1
			end
		end
		chCnt = chCnt + 1
    until chCnt == 10
	for C,cv in pairs (ChannelList) do
		Channel = getChannelRef(cv.chan)

		if(Channel ~= -1) then
			local newChan = {}
			newChan.Device   = configData.Variables[Channel].Device
			newChan.Service  = configData.Variables[Channel].Service
			newChan.Variable = configData.Variables[Channel].Variable

			if(cv.axis ~= nul) then
				if(tonumber(cv.axis) ~= 0) then
					newChan.yAxis = tonumber(cv.axis)
				end
			end

			table.insert(newTable.Channels, newChan)
		end
	end

	if(lul_parameters.period ~= nul) then
		if(tonumber(lul_parameters.period) ~= 0) then
			newTable.Period = tonumber(lul_parameters.period)
		end
	end

	if(newTable.Period == 0) then
		newTable.Period = 86400
	end

	newTable.Name      = lul_parameters.name
	newTable.Reference = lul_parameters.ref

--	luup.log(DATAMINE_LOG_NAME .. "controlSaveGraph: " .. json.encode(newTable))


	-- See if there is already a definition with this name
	for k,v in pairs (configData.Graphs) do
		if(v.Name == newTable.Name) then
			-- Remove it for update
			configData.Graphs[k] = nil
		end
	end

	if(chCnt == 0) then
		return "NOK-NoChan"
	end

	table.insert(configData.Graphs, newTable)

	saveConfig(1)

	return json.encode(configData.Graphs)
end

-- Get the list of saved graphs
function controlGetGraphList()
	return json.encode(configData.Graphs)
end

-- Get the list of saved graphs
function controlGetGUIConfig()
	return json.encode(configData.guiConfig)
end

-- Return variable types
function processVarTypes()
	local lul_html = '['..
			'{"id":1, "name": "Temperature"},'..
			'{"id":2, "name": "Humidity"},'..
			'{"id":3, "name": "Pressure"},'..
			'{"id":4, "name": "Status"},'..
			'{"id":5, "name": "Percent"},'..
			'{"id":6, "name": "Power"}'..
			']'

	return lul_html
end

function controlDelVariable(lul_parameters)
	local ref = tonumber(lul_parameters.ref)
	local name = lul_parameters.name

	if(ref == nil) then
		return "NOK-ID"
	end
	if(name == nil) then
		return "NOK-NAME"
	end

	-- Search for the variable
	local foundId = -1
	for k,v in pairs (configData.Variables) do
		if(v.Id==ref and v.Name==name) then
			luup.log(DATAMINE_LOG_NAME.."Delete Variable: D["..v.Device.."] S["..v.Service.."] V["..v.Variable.."]")
			-- Remove from the configuration
			table.remove(configData.Variables, k)
		end
	end

	saveConfig(1)

	return json.encode(configData.Variables)
end


-- Save variable properties
function controlSaveConfig(lul_parameters)
	-- Loop through options
	local configChanged = false

	for k,v in pairs (lul_parameters) do
		if(v.Device==device and v.Service==service and v.Variable==variable) then
			luup.log(DATAMINE_LOG_NAME.."GUI Config: '"..k.."' set to '"..v.."'")
			if(v == '""') then
				configData.guiConfig[k] = nil
			else
				configData.guiConfig[k] = v
			end
			configChanged = true
		end
	end

	-- Save the configuration if it's changed
	if(configChanged == true) then
		saveConfig(1)
	end

	return "OK"
end

-- Save variable properties
function controlSaveVariable(lul_parameters)
	-- Required parameters
	local device   = tonumber(lul_parameters.device)
	local service  = lul_parameters.service
	local variable = lul_parameters.variable

	if(device == nil) then
		return "NOK-NODEVICE"
	end
	if(service== nil) then
		return "NOK-NOSERVICE"
	end
	if(variable == nil) then
		return "NOK-NOVARIABLE"
	end

	luup.log(DATAMINE_LOG_NAME.."Saving: D["..device.."] S["..service.."] V["..variable.."]")

	-- Temp disable dashboard
	--if(dashboard ~= nil) then
	--	dashboard = false
	--end

	-- Ensure config data is initialised
	if(configData == nil) then
		configData = {}
		configData.Variables = {}
	end

	local configChanged = false

	-- Search for the variable
	local foundId = -1
	for k,v in pairs (configData.Variables) do
		if(v.Device==device and v.Service==service and v.Variable==variable) then
			foundId = v.Id
		end
	end

	if(foundId == -1) then
		local newTable        = {}
		newTable.Id            = configData.nextId
		configData.nextId      = configData.nextId + 1
		newTable.Device        = device
		newTable.Service       = service
		newTable.Variable      = variable
		newTable.Type          = 0
		newTable.FirstRec      = 0
		newTable.LastVal       = 0
		newTable.LastRec       = 0
		newTable.Name          = luup.devices[device].description .. " - " .. variable
		newTable.DataType      = getDataType(newTable)
		newTable.Lookup        = getLookup(newTable)
		newTable.DrowsyWarning = 3600000
		newTable.DrowsyError   = 86400000
		newTable.DataOffset    = 0

		if(newTable.Lookup == nil) then
			newTable.Lookup   = {}
		end

		if(variable == "Status") then
			newTable.Type = 1
		end
		if(variable == "Watts") then
			newTable.Type = 1
		end

		-- Remove invalid characters from filenames
		local fname = newTable.Id .. " " .. luup.devices[device].description .. " - " .. variable
		local sfile = ""
		for g in fname:gmatch("[^:/\|#*&?%%]") do
			sfile = sfile .. g
		end
		newTable.Archive  = sfile

		table.insert(configData.Variables, newTable)

		foundId = newTable.Id
		configChanged = true
	end

	-- Search for the variable
	local foundId = -1
	for k,v in pairs (configData.Variables) do
		if(v.Device==device and v.Service==service and v.Variable==variable) then
			foundId = k
		end
	end


	-- Update any variable properties
	if(lul_parameters.name ~= nil) then
		configData.Variables[foundId].Name = lul_parameters.name
		configChanged = true

		-- Check that a variable with this name doesn't already exist

		-- TODO

	end


	if(lul_parameters.log ~= nil) then
		if(tonumber(lul_parameters.log) == 1) then
			configData.Variables[foundId].Logging = 1
		else
			configData.Variables[foundId].Logging = 0
		end
		configChanged = true
	end

	if(lul_parameters.unit ~= nil) then
		configData.Variables[foundId].Units = lul_parameters.unit
		configChanged = true
	end

	if(lul_parameters.doff ~= nil) then
		configData.Variables[foundId].DataOffset = tonumber(lul_parameters.doff)
		configChanged = true
	end

	if(lul_parameters.gtype ~= nil) then
		luup.log(DATAMINE_LOG_NAME.."Graph Type = "..lul_parameters.gtype)
		configData.Variables[foundId].Type = tonumber(lul_parameters.gtype)
		configChanged = true
	end

	if(lul_parameters.dwar ~= nil) then
		configData.Variables[foundId].DrowsyWarning = tonumber(lul_parameters.dwar)
		configChanged = true
	end

	if(lul_parameters.derr ~= nil) then
		configData.Variables[foundId].DrowsyError = tonumber(lul_parameters.derr)
		configChanged = true
	end

	-- Detect if this is an energy logging variable
	if(service==ENERGY_SERVICE and variable==ENERGY_VARIABLE) then
		-- Yes, so we should allow the energy configuration options

		if(lul_parameters.ecat ~= nil) then
			luup.log(DATAMINE_LOG_NAME.."Energy Category = "..lul_parameters.ecat)
			configData.Variables[foundId].EnergyCat = tonumber(lul_parameters.ecat)
			configChanged = true
		end
	end

	-- Enable the watch callback if logging is enabled
	if(configData.Variables[foundId].Logging == 1) then
		-- Enable logging
		luup.variable_watch('watchVariable', configData.Variables[foundId].Service, configData.Variables[foundId].Variable, tonumber(configData.Variables[foundId].Device))
		luup.log(DATAMINE_LOG_NAME.."Watching: D["..tonumber(device).."] S["..service.."] V["..variable.."]")
	end

	-- Save the configuration if it's changed
	if(configChanged == true) then
		saveConfig(1)
	end

	luup.log(DATAMINE_LOG_NAME..returnList(device, service, variable))

    return returnList(device, service, variable)
end


-- Return graph data
function incomingData(lul_request, lul_parameters, lul_outputformat)
	luup.log(DATAMINE_LOG_NAME .. "RAW REQUEST: Entry")
	for i,v in pairs(lul_parameters) do
		luup.log(DATAMINE_LOG_NAME .. "RAW REQUEST: " .. i.." == "..v)
	end

	local clockStart = os.clock()
	local timeoutTime = clockStart + timeoutPeriod

	local Start      = tonumber(lul_parameters.start)
	local Stop       = tonumber(lul_parameters.stop)
	local Channel
	local ChannelList = {}

	if Start == nil then
		Start = 0
	end
	if Stop == nil then
		Stop = 0
	end


    local chName
    local chCnt
    local outCnt

    outCnt = 0
	chCnt = 0
    repeat
        chName = "channel"..chCnt
		if(lul_parameters[chName] ~= nul) then
			if(tonumber(lul_parameters[chName]) ~= 0) then
				ChannelList[outCnt] = tonumber(lul_parameters[chName])
				outCnt = outCnt + 1
			end
		end
		chCnt = chCnt + 1
    until chCnt == 10

	local lastVal
	local lastTime = 0
	local nextTime = 0
	local Points = 0
	local TotalPoints = 0
	local first
	local WeekNum
	local logfile
	local inf
	local line
	local Sample1
	local Sample2
	local lul_html
	local multiChan
	local minVal
	local maxVal
	local n_val
	local logLastTime
	local logLastVal
	local errNum = 0


	lul_html = '{"series":['

	multiChan = 0
	for C,cv in pairs (ChannelList) do
		Channel = getChannelRef(cv)

		if(Channel ~= -1) then
			-- Default graph is last 1 day
			if(Stop == 0) then
				Stop = os.time()
			end

			-- The end time can't be newer than now. Otherwise we could get into a loop!
			if(Stop > os.time()) then
				Stop = os.time()
			end

			if(Start == 0) then
				Start = Stop - (86400 * 1)
			end

			if(Start < configData.Variables[Channel].FirstRec) then
				Start = configData.Variables[Channel].FirstRec
			end

			if(Start < FIRST_YEAR) then
				Start = FIRST_YEAR
			end
			-- Don't try and do anything fancy if the times are screwed up
			-- This shouldn't ever happen!
			if(Stop < Start) then
				Stop = os.time()
				Start = Stop - (86400 * 1)
			end

			-- Calculate the average time between samples
			Sample1 = math.floor((Stop - Start) / 700)

--			luup.log(DATAMINE_LOG_NAME .. "ID: "..Channel.." Start: " .. Start .. " Stop: " .. Stop .. " Sample: " .. Sample1)

			if(Sample1 > 43200) then
				WeekNum  = math.floor(Start / LOGTIME_DAILY)
				nextTime = math.floor(Stop  / LOGTIME_DAILY)
				dataType = "D"
			elseif(Sample1 > 1800) then
				WeekNum  = math.floor(Start / LOGTIME_HOURLY)
				nextTime = math.floor(Stop  / LOGTIME_HOURLY)
				dataType = "H"
			else
				-- Needs something in here to NOT sub sample light switch data - at least at a reduced sample!
				if(configData.Variables[Channel].Type == 1) then
					Sample1 = 1
				end
				WeekNum  = math.floor(Start / LOGTIME_RAW)
				nextTime = math.floor(Stop  / LOGTIME_RAW)
				dataType = "R"
			end

			Sample2 = Sample1 * 5

			-- Find the first record after the start time
			repeat
				logfile = dataDir .. configData.Variables[Channel].Archive .. " ["..dataType..WeekNum.."].txt"
		--		luup.log(DATAMINE_LOG_NAME .. "Trying " .. logfile)
				inf = io.open(logfile, 'r')
				if(inf ~= nil) then
					break
				end
				WeekNum = WeekNum + 1
			until WeekNum > nextTime

			Points   = 0
			TotalPoints = 0
			first    = 1
			lastTime = Start - Sample1
			nextTime = Start
			minVal      =  9999999999
			maxVal      = -9999999999


			lastVal  = configData.Variables[Channel].LastVal
			if(configData.Variables[Channel].Alpha == 1) then
				lastVal = configData.Variables[Channel].Lookup[lastVal]
			end

			logLastTime = lastTime
			logLastVal  = lastVal

			if(multiChan == 1) then
				lul_html = lul_html .. ','
			end
			multiChan = 1

			lul_html = lul_html .. '{"label":"'..configData.Variables[Channel].Name..'","data":['

			if(inf == nil) then
				luup.log(DATAMINE_LOG_NAME .. "1:Unable to open file for read - " .. logfile)
			else
				local l_time = 0
				local l_val  = 0

				while true do
					if os.clock() > timeoutTime then
						errNum = 1
						break
					end

					line = inf:read("*line")
					if(line == nil) then
						-- Close current file
						inf:close()

						-- Need to open the next weekly file
						WeekNum = WeekNum+1
						logfile = dataDir .. configData.Variables[Channel].Archive .. " ["..dataType..WeekNum.."].txt"

						-- Open the file
						inf = io.open(logfile, 'r')
						if(inf == nil) then
							--luup.log(DATAMINE_LOG_NAME .. "2:Unable to open file for read - " .. logfile)
							break
						end

						-- Read the first line
						line = inf:read("*line")
						if(line == nil) then
							break
						end
					end

					local startp,endp = string.find(line,",",1)

					if(startp == nil) then
						luup.log(DATAMINE_LOG_NAME .. "Error reading CSV >> " .. line .. "<<");
						break;
					end

					l_time = tonumber(string.sub(line,1,startp-1))
					l_val  = string.sub(line,startp+1)
					if(configData.Variables[Channel].Alpha == 1) then
	--					luup.log(DATAMINE_LOG_NAME .. "Alpha = "..l_val)
						l_val = configData.Variables[Channel].Lookup[l_val]
	--					if(l_val ~= nil) then
	--						luup.log(DATAMINE_LOG_NAME .. "Alpha = "..l_val)
	--					else
	--						luup.log(DATAMINE_LOG_NAME .. "Alpha = nil")
	--					end
					else
						l_val  = tonumber(l_val)
					end

					if(l_time == nil or l_val == nil) then
						break
					end

					if(l_time > Stop) then
						break
					end

					-- SLIGHT BODGE - makes sure zero changes are recorded
--					if(lastVal ~= 0 and l_val == 0) then
--						nextTime = nextTime - Sample1
--					end

					TotalPoints = TotalPoints + 1

					if(l_time >= nextTime) then
						if(logLastTime < l_time - (Sample2) and first == 0) then
							lul_html = lul_html .. ","

							-- Since we only log changes, we need to assume that the data was
							-- constant between changes. Therefore, to avoid incorrect graphs
							-- we need to add another plot if the time between points is too long.
							if(configData.Variables[Channel].Type == 1) then
								lul_html = lul_html .. "["..lastTime.."000,"..lastVal.."],"
								Points = Points+1
--							elseif(logLastVal == 0) then
--								lul_html = lul_html .. "["..lastTime.."000,0],"
--								Points = Points+1
							end
							lul_html = lul_html .. "["..logLastTime.."000,"..logLastVal.."]"
							Points = Points+1
						end

						-- Keep track of max and min values
						if(l_val < minVal) then
							minVal = l_val
						end
						if(l_val > maxVal) then
							maxVal = l_val
						end

--				luup.log(DATAMINE_LOG_NAME .. l_time .. "  ".. l_val)
						if(first == 0) then
							lul_html = lul_html .. ","

							-- Since we only log changes, we need to assume that the data was
							-- constant between changes. Therefore, to avoid incorrect graphs
							-- we need to add another plot if the time between points is too long.
							if(configData.Variables[Channel].Type == 1) then
								lul_html = lul_html .. "["..l_time.."000,"..lastVal.."],"
								Points = Points+1
--							elseif(lastVal == 0) then
--								lul_html = lul_html .. "["..l_time.."000,0],"
--								Points = Points+1
							end
						else
							if(lastVal ~= INVALID_VALUE) then
								lul_html = lul_html .. "["..Start.."000,"..lastVal.."],"
								Points = 1

								if(configData.Variables[Channel].Type == 1) then
									lul_html = lul_html .. "["..l_time.."000,"..lastVal.."],"
									Points = 2
								end
							else
								Start = l_time
							end
							first = 0
						end

	--					lul_html = lul_html .. "=== "..l_time.."  ["..l_time.."000,"..l_val.."]"
						lul_html = lul_html .. "["..l_time.."000,"..l_val.."]"
						Points = Points+1

--						nextTime = nextTime + Sample1
						nextTime = l_time + Sample1

						-- Remember the last datapoint
						-- Required here to avoid issues with subsampling
						lastTime = l_time
						lastVal  = l_val
					elseif(l_time < Start) then
						-- Remember the last datapoint logged
						-- Required here to get the correct start datapoint
						lastTime = l_time
						lastVal  = l_val
					end
					logLastTime = l_time
					logLastVal  = l_val
				end

				if(inf ~= nil) then
					-- Close file
					inf:close()
				end
			end

	--		if(configData.Variables[Channel].Type == 1) then
				-- If there were no points to display, then we need to add a start point!
				if(Points == 0) then
					lul_html = lul_html .. "["..Start.."000,"..lastVal.."]"
					Points = 1
				end
				lul_html = lul_html .. ",["..Stop.."000,"..lastVal.."]"
				Points   = Points+1
				lastTime = Stop
	--		end

			lul_html = lul_html .. ']'

			if(configData.Variables[Channel].Alpha == 1) then
				lul_html = lul_html .. ',"ticks":[';
				first = 1
				for k,v in pairs (configData.Variables[Channel].Lookup) do
					if(first == 0) then
						lul_html = lul_html .. ','
					end
					first = 0
					lul_html = lul_html .. '["'.. k ..'",' .. v .. "]"
				end
				lul_html = lul_html .. "]"
			end
			lul_html = lul_html .. ',"pointsRet":'..Points..',"pointsTot":'..TotalPoints..',"min":'..minVal..',"max":'..maxVal..'}'
		end
	end
	lul_html = lul_html .. '],"procTime":'..os.clock()-clockStart

	if(errNum ~= 0) then
		lul_html = lul_html..',"error":'
		if(errNum == 1) then
			lul_html = lul_html..'"Data truncated due to timeout."'
		end
	end

	lul_html = lul_html .. ',"min":'..Start..',"max":'..lastTime..'}'
--	lul_html = lul_html .. '],"min":'..Start..',"max":'..lastTime..',"points":'..Points..'}'

--	luup.log(DATAMINE_LOG_NAME, "Done")
	luup.log(DATAMINE_LOG_NAME.."RAW RESPONSE: "..lul_html)
    return lul_html
end


















