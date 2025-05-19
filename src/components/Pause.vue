<template>
    <div class="pause-menu-container">
        <div class="pause-menu">
            <div class="game-title">CODE RIDER</div>
            

            
            <div class="menu-buttons">
                <button class="game-button continue-button" @click="onResumeClick">CONTINUE</button>
                <button class="game-button restart-button" @click="reload()">RESTART</button>
            </div>
            
            <div class="game-controls-info">
                <div class="control-item">
                    <span class="key">←/→</span> Drive
                </div>
                <div class="control-item">
                    <span class="key">SPACE</span> Pause
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    methods: {
        onResumeClick ( evt ) {
            this.$emit( "resume" )
        },
        reload () {
            window.location.reload()
        }
    }
}
</script>

<style lang="scss">
.pause-menu-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9999;
}

.pause-menu {
    background-color: rgba(30, 30, 60, 0.9);
    border-radius: 15px;
    padding: 30px;
    width: 400px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.8), 0 0 10px rgba(100, 200, 255, 0.5);
    color: white;
    font-family: 'Arial', sans-serif;
    text-align: center;
    border: 2px solid rgba(100, 200, 255, 0.5);
}

.game-title {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #4fc3f7;
    text-shadow: 0 0 10px rgba(100, 200, 255, 0.8);
}

.menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
}

.game-button {
    padding: 15px 20px;
    font-size: 20px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 0, 0, 0.2);
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 0 rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 0, 0, 0.3);
    }
    
    &:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3), 0 0 5px rgba(0, 0, 0, 0.2);
    }
}

.continue-button {
    background-color: #4caf50;
    color: white;
}

.restart-button {
    background-color: #f44336;
    color: white;
}

.game-controls-info {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 15px;
    border-radius: 8px;
    text-align: left;
}

.control-item {
    margin-bottom: 8px;
    font-size: 14px;
    display: flex;
    align-items: center;
    
    &:last-child {
        margin-bottom: 0;
    }
}

.key {
    display: inline-block;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 3px 8px;
    border-radius: 4px;
    margin-right: 10px;
    font-family: monospace;
    font-weight: bold;
    font-size: 14px;
}
</style>