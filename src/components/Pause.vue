<template>
    <div class="pause-menu">
        <div class="game-title">CODE RIDER</div>
        <div class="menu-buttons">
            <button class="game-button continue-button" @click="onResumeClick">CONTINUE</button>
            <button class="game-button restart-button" @click="reload">RESTART</button>
        </div>
    </div>
</template>

<script>
import * as Vue from 'vue'

export default Vue.defineComponent({
    emits: ['resume'],
    setup(props, { emit }) {
        function onResumeClick(evt) {
            emit("resume")
        }

        function reload() {
            window.location.reload()
        }

        return {
            onResumeClick,
            reload
        }
    }
})
</script>

<style lang="scss">
/* Compact pause menu styling */
.pause-menu {
    background: linear-gradient(to bottom, rgba(40, 40, 60, 0.9), rgba(30, 30, 45, 0.95)) !important;
    border-radius: 8px !important;
    padding: 20px !important;
    width: 250px !important;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    font-family: 'Arial', sans-serif !important;
    text-align: center !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    position: relative !important;
    margin: 0 auto !important;
    max-height: 300px !important;
}

.game-title {
    font-size: 24px !important;
    font-weight: 700 !important;
    letter-spacing: 1px !important;
    margin-bottom: 15px !important;
    color: rgba(255, 255, 255, 0.9) !important;
    text-transform: uppercase !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
}

.menu-buttons {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
}

.game-button {
    padding: 10px 15px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 1px !important;
    text-transform: uppercase !important;
    border: none !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    background-color: rgba(40, 40, 60, 0.6) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
    
    &:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4) !important;
        background-color: rgba(50, 50, 70, 0.8) !important;
    }
    
    &:active {
        transform: translateY(1px) !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
    }
}

.continue-button {
    background: linear-gradient(to bottom, rgba(50, 50, 70, 0.8), rgba(40, 40, 55, 0.9)) !important;
    
    &:hover, &:active {
        background: linear-gradient(to bottom, rgba(255, 132, 0, 0.8), rgba(200, 100, 0, 0.7)) !important;
        color: white !important;
    }
}

.restart-button {
    background: linear-gradient(to bottom, rgba(40, 40, 60, 0.7), rgba(30, 30, 45, 0.8)) !important;
}
</style>