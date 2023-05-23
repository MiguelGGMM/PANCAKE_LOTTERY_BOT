# PANCAKE_LOTTERY_BOT
 This bot will help you to get the best tickets and some stats for BSC pancakeswap lottery
 
## CONFIG
 If you don't provide an 'API_KEY' then the events will be scanned using\
 the RPC, 'BLOCK_RANGE' sets the number of blocks will by scanned at\
 same time using your RPC, remember public nodes are usually limited\
 \
 'CHUNK_SIZE' is the number of transactions that will be checked using\
 your RPC at same time, 50 works fine for me using private RPC

## COMMANDS
 /stats: Get current lottery numbers stats\
 /gBT: Get current best lottery ticket\
 /gBTRn: Get best ticket randomizing with a seed provided\
 (required parameters: seed and nº of tickets, example: /gBTRn 0 5)\
 /help: How to use this bot\
